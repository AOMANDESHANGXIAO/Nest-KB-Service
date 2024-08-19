import { Injectable, HttpException } from '@nestjs/common';
import { SqlService } from '../db/index';
import { StudentTable } from 'src/crud/Table.model';
import {
  Login,
  Create,
  QueryCollaboration,
  LegendData,
  SeriesData,
  LinksData,
} from './Models/index';
import StudentCRUDer from 'src/crud/Student';
import PasswordHandler from '../utils/password.handler';
import JwtHandler from '../utils/jwt.handler';

@Injectable()
export class UserService extends SqlService {
  pwdHandler: PasswordHandler;
  jwtHandler: JwtHandler;
  studentCRUDer: StudentCRUDer;
  constructor() {
    super();
    this.pwdHandler = new PasswordHandler();
    this.jwtHandler = new JwtHandler();
    this.studentCRUDer = new StudentCRUDer(this);
  }

  // 业务
  public async create({ username, password, nickname, class_id }: Create) {
    const isExist = await this.studentCRUDer.findOneExist(username);
    if (isExist) {
      throw new HttpException('用户名已存在', 400);
    } else {
      await this.transaction(async () => {
        const hashedPassword = await this.pwdHandler.hasdPassword(password);
        await this.insert(
          this.generateInsertSql<StudentTable>(
            'student',
            ['username', 'password', 'nickname', 'class_id'],
            [[username, hashedPassword, nickname, class_id]],
          ),
        );
      });
      return {
        message: '注册成功',
        data: {},
      };
    }
  }

  // 业务
  public async login({ username, password }: Login) {
    // 判断用户是否存在
    const isExist = await this.studentCRUDer.findOneExist(username);
    if (!isExist) {
      throw new HttpException('用户不存在', 400);
    }

    // 判断密码是否正确
    const [user] = await this.studentCRUDer.findOneByUsername(username);

    const isMatch = await this.pwdHandler.comparePassword(
      password,
      user.password,
    );

    if (!isMatch) {
      throw new HttpException('密码错误', 400);
    }

    // 查询用户的小组信息
    const [groupInfo] = await this.studentCRUDer.findUserGroupById(
      +user.group_id,
    );

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

  public async queryUserCollInfo({ id, group_id }: QueryCollaboration) {
    // 返回给前端的数据集合
    let LegendData: LegendData = [];
    let SeriesData: SeriesData[] = [];
    let LinksData: LinksData[] = [];

    const [memberIdeaList, sumAndReviseList, userList, interactions] =
      await Promise.all([
        this.studentCRUDer.findMembersIdeaNumbersById(group_id),
        this.studentCRUDer.findMembersSummaryAndReviseById(group_id),
        this.studentCRUDer.findAllByGroupId(group_id),
        this.studentCRUDer.findInteractionByGroupId(group_id),
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
}
