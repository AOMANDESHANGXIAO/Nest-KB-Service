import { Injectable, HttpException } from '@nestjs/common';
import { SqlService } from '../db/index';
import {
  User,
  UserUpdateDto,
  Login,
  Create,
  QueryCollaboration,
  LegendData,
  SeriesData,
  LinksData,
} from '../models/User';
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
  public async create({ username, password, nickname, class_id }: Create) {
    const isExist = await this.findOneExist(username);
    if (isExist) {
      throw new HttpException('用户名已存在', 400);
    } else {
      this.beginTransaction();

      const hashedPassword = await this.pwdHandler.hasdPassword(password);

      try {
        await this.insert(
          this.generateInsertSql(
            'student',
            ['username', 'password', 'nickname', 'class_id'],
            [[username, hashedPassword, nickname, class_id]],
          ),
        );
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
  public async login({ username, password }: Login) {
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

  public async updateUser(param: UserUpdateDto) {
    const { id } = param;
    const columValues = this.generateColumnValusByObj(param, ['id']);

    const sql = this.generateUpdateSql('student', columValues, [
      { column: 'id', value: id },
    ]);

    return this.update(sql);
  }

  public async queryUserCollInfo({ id, group_id }: QueryCollaboration) {
    // 返回给前端的数据集合
    let LegendData: LegendData = [];
    let SeriesData: SeriesData[] = [];
    let LinksData: LinksData[] = [];

    const [memberIdeaList, sumAndReviseList, userList, interactions] =
      await Promise.all([
        this.findMembersIdeaNumbersById(group_id),
        this.findMembersSummaryAndReviseById(group_id),
        this.findAllByGroupId(group_id),
        this.findInteractionByGroupId(group_id),
      ]);

    const userMap = this.mapUserList(userList);

    const stuDiscussMap = this.mapStudentData(memberIdeaList, [
      'proposeNum',
      'approveNum',
      'rejectNum',
    ]);

    const summaryMap = this.mapStudentData(sumAndReviseList, [
      'summaryNum',
      'reviseNum',
    ]);

    LegendData = this.generateLegendData(userList);
    SeriesData = this.generateSeriesData(
      LegendData,
      userMap,
      stuDiscussMap,
      summaryMap,
    );
    LinksData = this.generateLinksData(LegendData, interactions);

    const { proposeNum, feedbackNum, summaryNum } = this.getSelfAnalysisData(
      id,
      stuDiscussMap,
      summaryMap,
    );

    return {
      data: {
        selfAnalysisList: this.createSelfAnalysisList(
          proposeNum,
          feedbackNum,
          summaryNum,
        ),
        Indicator: this.createIndicator(stuDiscussMap, summaryMap),
        LegendData,
        SeriesData,
        LinksData,
        RelationShipSeriesData: LegendData.map((name) => ({ name })),
      },
    };
  }

  private generateLegendData(userList: { id: number; stuName: string }[]) {
    return userList.map((u) => u.stuName);
  }

  private mapUserList(
    userList: { id: number; stuName: string }[],
  ): Map<string, { id: number; stuName: string }> {
    const userMap = new Map();
    userList.forEach((r) => {
      userMap.set(r.stuName, r);
    });
    return userMap;
  }

  private mapStudentData(dataList: any[], fields: string[]): Map<number, any> {
    const dataMap = new Map();
    dataList.forEach((data) => {
      const dataObj: any = {};
      fields.forEach((field) => {
        dataObj[field] = Number(data[field] || 0);
      });
      dataMap.set(data.id, dataObj);
    });
    return dataMap;
  }

  private generateSeriesData(
    LegendData: string[],
    userMap: Map<string, any>,
    stuDiscussMap: Map<number, any>,
    summaryMap: Map<number, any>,
  ) {
    return LegendData.map((legend) => {
      const id = userMap.get(legend).id;
      const value = [
        'proposeNum',
        'approveNum',
        'rejectNum',
        'summaryNum',
        'reviseNum',
      ].map(
        (key) => stuDiscussMap.get(id)?.[key] || summaryMap.get(id)?.[key] || 0,
      );
      return { name: legend, value };
    });
  }

  private generateLinksData(LegendData: string[], interactions: any[]): any[] {
    const LinksData = [];
    LegendData.forEach((source, i) => {
      LegendData.slice(i + 1).forEach((target) => {
        const existingLink = LinksData.find(
          (link) =>
            (link.source === source && link.target === target) ||
            (link.source === target && link.target === source),
        );
        if (!existingLink) {
          LinksData.push({ source, target, lineStyle: { width: 0 } });
        }
      });
    });

    interactions.forEach((interaction) => {
      const link = LinksData.find(
        (link) =>
          (link.source === interaction.activer &&
            link.target === interaction.inActiver) ||
          (link.source === interaction.inActiver &&
            link.target === interaction.activer),
      );
      if (link) link.lineStyle.width += 1;
    });

    return LinksData;
  }

  private getSelfAnalysisData(
    id: number,
    stuDiscussMap: Map<number, any>,
    summaryMap: Map<number, any>,
  ) {
    const proposeNum = stuDiscussMap.get(id)?.proposeNum || 0;
    const feedbackNum =
      (stuDiscussMap.get(id)?.approveNum || 0) +
      (stuDiscussMap.get(id)?.rejectNum || 0);
    const summaryNum = summaryMap.get(id)?.summaryNum || 0;
    return { proposeNum, feedbackNum, summaryNum };
  }

  private createSelfAnalysisList(
    proposeNum: number,
    feedbackNum: number,
    summaryNum: number,
  ) {
    return [
      {
        iconName: 'discussion',
        text: '参与了讨论',
        num: proposeNum + feedbackNum + summaryNum,
      },
      { iconName: 'share', text: '分享了观点', num: proposeNum },
      { iconName: 'feedback', text: '反馈了观点', num: feedbackNum },
      { iconName: 'summary', text: '总结了讨论', num: summaryNum },
    ];
  }

  private createIndicator(
    stuDiscussMap: Map<number, any>,
    summaryMap: Map<number, any>,
  ) {
    const maxValues = [
      'proposeNum',
      'approveNum',
      'rejectNum',
      'summaryNum',
      'reviseNum',
    ].map((key) => {
      return Math.max(
        ...Array.from(stuDiscussMap.values())
          .concat(summaryMap.values())
          .map((data) => data[key] || 0),
      );
    });

    return [
      { name: '发布', max: maxValues[0] },
      { name: '支持', max: maxValues[1] },
      { name: '反对', max: maxValues[2] },
      { name: '总结', max: maxValues[3] },
      { name: '修改', max: maxValues[4] },
    ];
  }

  private async findOneExist(key: number | string): Promise<boolean> {
    if (typeof key === 'number') {
      return false;
    } else if (typeof key === 'string') {
      const res = await this.findOneByUsername(key);
      return res.length > 0;
    }
    return false;
  }

  private async findOneByUsername(username: string): Promise<User[]> {
    const sql = `SELECT * FROM student WHERE username = '${username}'`;

    const res = await this.query<User>(sql);

    return res;
  }

  private async findUserGroupById(id: number) {
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

  private async findMembersIdeaNumbersById(group_id: number) {
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

  private async findMembersSummaryAndReviseById(group_id: number) {
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

  private async findAllByGroupId(group_id: number) {
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

  private async findInteractionByGroupId(group_id: number) {
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
