import { Injectable, HttpException } from '@nestjs/common';
import { SqlService } from '../db/index';
import { User, Login, Create, QueryCollaboration } from '../models/User';
import PasswordHandles from '../utils/password.handler';
import JwtHandler from '../utils/jwt.handler';

@Injectable()
export class UserService extends SqlService {
  pwdHandler: PasswordHandles;
  jwtHandler: JwtHandler;
  constructor() {
    super();
    this.pwdHandler = new PasswordHandles();
    this.jwtHandler = new JwtHandler();
  }

  // 业务
  async create(createUserInput: Create) {
    const { username, password, nickname, class_id } = createUserInput;

    const isExist = await this.findOneExist(username);
    if (isExist) {
      throw new HttpException('用户名已存在', 400);
    } else {
      this.beginTransaction();

      const hashedPassword = await this.pwdHandler.hasdPassword(password);

      const sql = `INSERT INTO student (username, password, nickname, class_id) VALUES ('${username}', '${hashedPassword}', '${nickname}', ${class_id})`;

      try {
        await this.insert(sql);
        await this.closeTransaction();
        await this.commit();
        return {
          message: '创建用户成功',
          data: {},
        };
      } catch (err) {
        throw new HttpException('创建用户失败', 400);
      }
    }
  }

  // 业务
  async login(param: Login) {
    const { username, password } = param;

    // 判断用户是否存在
    const isExist = await this.findOneExist(username);
    if (!isExist) {
      throw new HttpException('用户不存在', 400);
    }

    // 判断密码是否正确
    const [user] = await this.findOneByUsername(username);

    const isMatch = await this.pwdHandler.comparePassword(
      password,
      user.password,
    );

    if (!isMatch) {
      throw new HttpException('密码错误', 400);
    }

    // 查询用户的小组信息
    const [groupInfo] = await this.findUserGroupById(+user.group_id);

    return {
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        group_id: user.group_id,
        class_id: user.class_id,
        group_name: groupInfo?.group_name || null,
        group_code: groupInfo?.group_code || null,
        group_color: groupInfo?.group_color || null,
        token: this.jwtHandler.generateJwt(user.username),
      },
    };
  }

  // 业务
  async queryUserCollaborationData(param: QueryCollaboration) {
    let { id, group_id } = param;
    id = +id;
    group_id = +group_id;

    const LegendData = [];
    const SeriesData = [];
    const LinksData = [];

    const memberIdeaList = await this.findMembersIdeaNumbersById(group_id);

    const sumAndReviseList =
      await this.findMembersSummaryAndReviseById(group_id);

    const userList = await this.findAllByGroupId(group_id);

    // 生成legend+记录小组成员的姓名和id
    const userMap = new Map();
    userList.forEach((r) => {
      LegendData.push(r.stuName);
      userMap.set(r.stuName, r);
    });

    let maxP = 0; // 分享
    let maxR = 0; // 不同意
    let maxA = 0; // 同意
    let maxS = 0; // 总结
    let maxRe = 0; // 修改

    /**
     * 学生个人的信息
     */
    let proposeNum = 0;
    let feedbackNum = 0;
    let summaryNum = 0;
    /**
     * 查找成员分享观点最多、同意观点最多以及不同意观点最多的成员
     */
    const stuDiscussMap = new Map();
    memberIdeaList.forEach((r) => {
      if (Number(r.proposeNum) > maxP) {
        maxP = Number(r.proposeNum);
      }

      if (Number(r.approveNum) > maxA) {
        maxA = Number(r.approveNum);
      }

      if (Number(r.rejectNum) > maxR) {
        maxR = Number(r.rejectNum);
      }

      stuDiscussMap.set(r.id, r);
    });

    const summaryMap = new Map();
    sumAndReviseList.forEach((r) => {
      if (Number(r.summaryNum) > maxS) {
        maxS = Number(r.summaryNum);
      }
      if (Number(r.reviseNum) > maxRe) {
        maxRe = Number(r.reviseNum);
      }

      // 存储每个学生的总结次数
      summaryMap.set(r.id, {
        summaryNum: Number(r.summaryNum),
        reviseNum: Number(r.reviseNum),
      });
    });
    /**
     * 求学生本人的各方面数据
     */
    proposeNum = Number(stuDiscussMap.get(id).proposeNum);
    feedbackNum =
      Number(stuDiscussMap.get(id).approveNum) +
      Number(stuDiscussMap.get(id).rejectNum);
    summaryNum = Number(summaryMap.get(id).summaryNum);

    const Indicator = [
      {
        name: '发布',
        max: maxP,
      },
      {
        name: '支持',
        max: maxA,
      },
      {
        name: '反对',
        max: maxR,
      },
      {
        name: '总结',
        max: maxS,
      },
      {
        name: '修改',
        max: maxRe,
      },
    ];
    // 找出每个学生发布、支持、反对、总结、修改的情况
    const valueSequence = [
      'proposeNum',
      'approveNum',
      'rejectNum',
      'summaryNum',
      'reviseNum',
    ];

    // console.log('LegendData ===>', LegendData)

    LegendData.map((legend) => {
      // console.log(legend)
      const value = [0, 0, 0, 0, 0];
      const stuId = Number(userMap.get(legend).id); // 通过名字找到id

      stuDiscussMap.get(stuId) &&
        Object.keys(stuDiscussMap.get(stuId)).map((key) => {
          if (valueSequence.includes(key)) {
            value[valueSequence.indexOf(key)] = Number(
              stuDiscussMap.get(stuId)[key],
            );
          }
        });

      summaryMap.get(stuId) &&
        Object.keys(summaryMap.get(stuId)).map((key) => {
          if (valueSequence.includes(key)) {
            value[valueSequence.indexOf(key)] = Number(
              summaryMap.get(stuId)[key],
            );
          }
        });

      SeriesData.push({
        name: legend,
        value,
      });
    });

    const interactions = await this.findInteractionByGroupId(group_id);

    /**
     * 组内互动的LinksData生成
     */
    for (let i = 0; i < LegendData.length; i++) {
      for (let j = i + 1; j < LegendData.length; j++) {
        if (i === j) continue;
        if (
          LinksData.find(
            (link) =>
              link.source === LegendData[i] && link.target === LegendData[j],
          )
        ) {
          continue;
        }

        if (
          LinksData.find(
            (link) =>
              link.source === LegendData[j] && link.target === LegendData[i],
          )
        ) {
          continue;
        }

        LinksData.push({
          source: LegendData[i],
          target: LegendData[j],
          lineStyle: {
            width: 0,
          },
        });
      }
    }

    // 根据result_4统计小组成员的互动次数
    for (let i = 0; i < interactions.length; i++) {
      for (let j = 0; j < LinksData.length; j++) {
        if (
          (LinksData[j].source === interactions[i].activer &&
            LinksData[j].target === interactions[i].inActiver) ||
          (LinksData[j].target === interactions[i].activer &&
            LinksData[j].source === interactions[i].inActiver)
        ) {
          LinksData[j].lineStyle.width += 1;
          break;
        }
      }
    }

    const data = {
      selfAnalysisList: [
        {
          iconName: 'discussion',
          text: '参与了讨论',
          num: Number(proposeNum) + Number(feedbackNum) + Number(summaryNum),
        },
        {
          iconName: 'share',
          text: '分享了观点',
          num: Number(proposeNum),
        },
        {
          iconName: 'feedback',
          text: '反馈了观点',
          num: Number(feedbackNum),
        },
        {
          iconName: 'summary',
          text: '总结了讨论',
          num: Number(summaryNum),
        },
      ],
      Indicator,
      LegendData,
      SeriesData,
      LinksData,
      RelationShipSeriesData: LegendData.map((legend) => {
        return {
          name: legend,
        };
      }),
    };

    return {
      data,
    };
  }

  async findOneExist(key: number | string): Promise<boolean> {
    if (typeof key === 'number') {
      return false;
    } else if (typeof key === 'string') {
      const res = await this.findOneByUsername(key);
      return res.length > 0;
    }
    return false;
  }

  async findOneByUsername(username: string): Promise<User[]> {
    const sql = `SELECT * FROM student WHERE username = '${username}'`;

    const res = await this.query<User>(sql);

    return res;
  }

  async findUserGroupById(id: number) {
    const sql = `
    SELECT 
    id, 
    group_color,
    group_name,
    group_code
    FROM \`group\` t1 WHERE t1.id = ${id}
  `;

    const result = await this.query<{
      id: number;
      group_color: string;
      group_name: string;
      group_code: string;
    }>(sql);

    return result;
  }

  async findMembersIdeaNumbersById(group_id: number) {
    const sql = `
    SELECT
      t1.student_id AS id,
      t3.nickname AS NAME,
      sum( CASE WHEN t2.type = 'idea_to_group' THEN 1 ELSE 0 END ) AS proposeNum,
      sum( CASE WHEN t2.type = 'reject' THEN 1 ELSE 0 END ) AS rejectNum,
      sum( CASE WHEN t2.type = 'approve' THEN 1 ELSE 0 END ) AS approveNum 
    FROM
      node_table t1
      JOIN edge_table t2 ON t2.source = t1.id
      JOIN student t3 ON t3.id = t1.student_id 
      AND t3.group_id = ${group_id} 
    GROUP BY
      t1.student_id;`;

    const res = await this.query<{
      id: number;
      NAME: string;
      proposeNum: number;
      rejectNum: number;
      approveNum: number;
    }>(sql);

    return res;
  }

  async findMembersSummaryAndReviseById(group_id: number) {
    const sql = `
    SELECT
      t1.student_id AS id,
      t3.nickname as stuName,
      SUM( CASE WHEN t2.type = 'group' THEN 1 ELSE 0 END ) AS summaryNum,
      Sum( CASE WHEN t2.type = 'idea' THEN 1 ELSE 0 END ) AS reviseNum 
    FROM
      node_revise_record_table t1
      JOIN node_table t2 ON t2.type = 'group' 
      OR t2.type = 'idea'
      JOIN student t3 ON t3.id = t1.student_id 
      AND t3.group_id = ${group_id} 
      AND t2.id = t1.node_id 
    GROUP BY
      t1.student_id
    `;

    const res = await this.query<{
      id: number;
      stuName: string;
      summaryNum: number;
      reviseNum: number;
    }>(sql);

    return res;
  }

  async findAllByGroupId(group_id: number) {
    const sql = `
    SELECT
      t1.id,
      t1.nickname stuName 
    FROM
      student t1 
    WHERE
      t1.group_id = ${group_id}`;

    const res = await this.query<{
      id: number;
      stuName: string;
    }>(sql);

    return res;
  }

  async findInteractionByGroupId(group_id: number) {
    const sql = `
  SELECT 
      t1.source, 
      t1.target, 
      t3.nickname AS 'activer',
      t5.nickname AS 'inActiver'
  FROM 
      edge_table t1
  JOIN 
      node_table t2 ON t1.source = t2.id
  JOIN 
      student t3 ON t3.id = t2.student_id
  JOIN 
      node_table t4 ON t1.target = t4.id
  JOIN 
      student t5 ON t5.id = t4.student_id
  WHERE
      t3.group_id = ${group_id} and t1.type != 'group_to_discuss';`;

    const res = await this.query<{
      source: number;
      target: number;
      activer: string;
      inActiver: string;
    }>(sql);

    return res;
  }
}
