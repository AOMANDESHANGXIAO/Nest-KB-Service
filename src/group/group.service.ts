import { Injectable, HttpException } from '@nestjs/common';
import { SqlService } from '../db/index';
import { CreateDto, JoinDto } from './Models/index';
import StudentCRUDer from 'src/crud/Student';
import GroupCRUDer from 'src/crud/Group';
import { GroupTable, StudentTable, NodeTable } from 'src/crud/Table.model';

@Injectable()
export class GroupService extends SqlService {
  studentCrud: StudentCRUDer;
  groupCrud: GroupCRUDer;
  constructor() {
    super();
    this.studentCrud = new StudentCRUDer(this);
    this.groupCrud = new GroupCRUDer(this);
  }

  /**
   *
   * @param param0
   * @returns
   * 该方法用来拿到所有缺失的讨论话题id
   */
  private async getMissingGroupNodeIds({
    class_id,
    group_id,
  }: {
    class_id: number;
    group_id: number;
  }) {
    // 1. 查询班级的所有讨论
    const sqlAllDiscuss = `
    SELECT
      dt.id 
    FROM
      discussion dt 
    WHERE
      dt.topic_for_class_id = ${class_id}`;
    const allDiscussIds = await this.query<{ id: number }>(sqlAllDiscuss);
    // 2. 查询小组的讨论节点
    const sqlGroupNode = `
    SELECT
      nt.topic_id as id
    FROM
      node_table nt 
    WHERE
      nt.class_id = ${class_id}
      AND nt.group_id = ${group_id}`;
    const groupNodes = await this.query<{ id: number }>(sqlGroupNode);
    // 3. 判断小组的讨论节点是否都在班级的讨论中
    const groupNodeIds = groupNodes.map((item) => item.id);
    const missingNodeIds = allDiscussIds
      .filter((item) => !groupNodeIds.includes(item.id))
      .map((item) => item.id);
    return missingNodeIds;
  }

  private async createGroupNodeFromMissingIds({
    class_id,
    group_id,
    missingNodeIds,
  }: {
    class_id: number;
    group_id: number;
    missingNodeIds: number[];
  }) {
    const values = missingNodeIds.map((item) => [
      'group', // type
      '', // content
      class_id, // class_id
      group_id, // group_id
      item, // topic_id
      'NOW', // created_time
      '1', // version
    ]);
    await this.insert(
      this.generateInsertSql<NodeTable>(
        'node_table',
        [
          'type',
          'content',
          'class_id',
          'group_id',
          'topic_id',
          'created_time',
          'version',
        ],
        values,
      ),
    );
    await this.commit();
    return true;
  }
  /**
   *
   * @param param0
   * @returns
   * @description 创建团队
   */
  public async create({
    group_name,
    group_color,
    group_description,
    student_id,
    class_id,
  }: CreateDto) {
    // 查询学生是否有团队
    let group = await this.groupCrud.selectGroupByStudentId(student_id);
    if (group) {
      throw new Error('student has group');
    }
    // 查询组名是否重复
    group = await this.groupCrud.selectGroupByGroupname(group_name, class_id);
    if (group) {
      throw new Error('group name exists');
    }
    // 创建团队
    let newGroup: GroupTable;
    await this.transaction(async () => {
      const groupId = await this.insert(
        this.generateInsertSql<GroupTable>(
          'group',
          ['group_name', 'group_color', 'group_description', 'belong_class_id'],
          [[group_name, group_color, group_description, class_id]],
        ),
      );
      // 更新学生的团队id以及group的团队码为ckcXXX
      await Promise.all([
        this.update(
          this.generateUpdateSql(
            'student',
            [{ column: 'group_id', value: groupId }],
            [{ column: 'id', value: student_id, charset: '=' }],
          ),
        ),
        this.update(
          this.generateUpdateSql(
            'group',
            [{ column: 'group_code', value: `ckc${groupId}` }],
            [{ column: 'id', value: +groupId, charset: '=' }],
          ),
        ),
      ]);

      newGroup = await this.groupCrud.selectGroupByGroupId(+groupId);
      // console.log('newGroup', newGroup);
      // 当创建团队时，如果团队创建较晚，那么可能会没有小组讨论节点
      // 因此需要创建小组讨论节点
      const missingNodeIds = await this.getMissingGroupNodeIds({
        class_id,
        group_id: newGroup.id,
      });
      // console.log('missingNodeIds', missingNodeIds);
      if (missingNodeIds.length > 0) {
        await this.createGroupNodeFromMissingIds({
          class_id,
          group_id: newGroup.id,
          missingNodeIds,
        });
      }
    });

    return {
      data: {
        group_id: newGroup.id,
        group_name: newGroup.group_name,
        group_color: newGroup.group_color,
        group_description: newGroup.group_description,
        group_code: newGroup.group_code,
        belong_class_id: newGroup.belong_class_id,
      },
    };
  }

  public async join({ student_id, group_code }: JoinDto) {
    // FIXME: pick group by student_id but not by group_code
    const [checkedGroup, user] = await Promise.all([
      this.groupCrud.selectGroupByStudentId(student_id),
      this.studentCrud.selectOneById(student_id),
    ]);
    if (checkedGroup) {
      return this.failResponse('Already in group');
    }

    if (!user) {
      return this.failResponse('User not found');
    }

    const group = await this.groupCrud.selectGroupByOneField(
      'group_code',
      group_code,
    );

    if (!group) {
      return this.failResponse('Group not found');
    }

    this.transaction(async () => {
      await this.update(
        this.generateUpdateSql(
          'student',
          [{ column: 'group_id', value: group.id }],
          [{ column: 'id', value: student_id, charset: '=' }],
        ),
      );
    });

    return {
      data: {
        group_id: group.id,
        group_name: group.group_name,
        group_code: group.group_code,
        group_color: group.group_color,
        group_description: group.group_description,
        belong_class_id: group.belong_class_id,
      },
    };
  }

  /**
   *
   * @param id groupId
   * @description 根据小组id查询小组分享反馈、总结的数据
   */
  public async queryGroupCollData(id: number) {
    const res = await this.groupCrud.queryShareFeedbackSummaryNumByGroupId(+id);

    return {
      data: {
        list: [
          {
            iconName: 'discussion',
            text: '参与了讨论',
            num: res.feedback + res.share + res.summary,
          },
          {
            iconName: 'share',
            text: '分享了观点',
            num: res.share,
          },
          {
            iconName: 'feedback',
            text: '反馈了观点',
            num: res.feedback,
          },
          {
            iconName: 'summary',
            text: '总结了讨论',
            num: res.summary,
          },
        ],
      },
    };
  }

  /**
   *
   * @param id studentId
   * @description 根据学生id查询学生所在小组
   */
  public async queryStudentsGroup(id: number) {
    const group = await this.groupCrud.selectGroupByStudentId(+id);

    return {
      data: {
        group_id: group.id,
        group_name: group.group_name,
        group_code: group.group_code,
        group_color: group.group_color,
        group_description: group.group_description,
        belong_class_id: group.belong_class_id,
      },
    };
  }

  /**
   *
   * @param id groupId
   * @description 根据小组id查询小组成员提出观点、反馈数据
   */
  public async queryMemberProposeFeedbackData(id: number) {
    const res =
      await this.groupCrud.selectEachMemberProposeFeedbackSummaryByGroupId(id);

    return {
      data: {
        feedbackList: res.feedbacks,
        proposeList: res.proposes,
        summaryList: res.summarys,
      },
    };
  }

  /**
   *
   * @param param0
   * @returns
   * @description 根据小组id查询小组成员总结数据,等待重构
   * @refactor
   */
  public async queryMemberReviseData({
    group_id,
    topic_id,
  }: {
    group_id: number;
    topic_id: number;
  }) {
    return {
      data: {
        group_id,
        topic_id,
      },
      message: 'This api has been deprecated',
    };
  }

  /**
   *
   * @param id groupId
   * @description 根据小组id查询小组成员的贡献数据
   */
  public async queryEachMemberContribution(id: number) {
    const res =
      await this.groupCrud.selectEachOneProposeFeedbackSummaryByGroupId(id);

    // 查询最佳分享者、最佳反馈者、最佳总结者, 可以并列
    const maxRecord = {
      propose: 1,
      feedback: 1,
      summary: 1,
    };
    const bestStuIdRecords = {
      summary: [] as number[],
      propose: [] as number[],
      feedback: [] as number[],
    };

    res.forEach((item) => {
      maxRecord.summary = Math.max(maxRecord.summary, item.summaryNum);
      maxRecord.propose = Math.max(maxRecord.propose, item.proposeNum);
      maxRecord.feedback = Math.max(maxRecord.feedback, item.feedbackNum);
    });

    res.forEach((item) => {
      if (item.summaryNum === maxRecord.summary) {
        bestStuIdRecords.summary.push(item.id);
      }
      if (item.proposeNum === maxRecord.propose) {
        bestStuIdRecords.propose.push(item.id);
      }
      if (item.feedbackNum === maxRecord.feedback) {
        bestStuIdRecords.feedback.push(item.id);
      }
    });

    return {
      data: {
        list: res.map((item) => {
          const title: Array<{ text: string; type: string }> = [];

          if (bestStuIdRecords.summary.includes(item.id)) {
            title.push({
              text: '最佳总结者',
              type: 'summaryKing',
            });
          }
          if (bestStuIdRecords.propose.includes(item.id)) {
            title.push({
              text: '最佳分享者',
              type: 'shareKing',
            });
          }
          if (bestStuIdRecords.feedback.includes(item.id)) {
            title.push({
              text: '最佳反馈者',
              type: 'feedbackKing',
            });
          }

          return {
            id: item.id,
            name: item.name,
            title,
            data: {
              discussNum: item.proposeNum + item.feedbackNum + item.summaryNum,
              feedbackNum: item.feedbackNum,
              proposeNum: item.proposeNum,
              summaryNum: item.summaryNum,
            },
          };
        }),
      },
    };
  }

  public async queryGroupListByClassId(id: number) {
    if (!id || typeof +id !== 'number') {
      throw new HttpException('参数不合法', 400);
    }

    const sql = `
    SELECT
      g.id,
      g.group_name,
      g.group_description,
      g.group_code,
      g.group_color 
    FROM
      \`group\` g 
    WHERE
      g.belong_class_id = ${id}
    `;

    const list = await this.query<Omit<GroupTable, 'belong_class_id'>>(sql);

    return {
      data: {
        list: list.map((item) => ({
          ...item,
        })),
      },
    };
  }

  public async queryStudentsOfGroup(id: number) {
    if (!id || typeof +id !== 'number') {
      throw new HttpException('参数不合法', 400);
    }
    const sql = `
    SELECT
      s.id,
      s.group_id,
      s.class_id,
      s.username,
      s.nickname 
    FROM
      student s 
    WHERE
      s.group_id = ${id}
    `;
    const list = await this.query<Omit<StudentTable, 'password'>>(sql);
    return {
      data: {
        list,
      },
    };
  }
}
