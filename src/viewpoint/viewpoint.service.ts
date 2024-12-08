import { Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
import {
  CreateTopicArgs,
  CreateIdeaArgs,
  CreateAgreeArgs,
  CreateDisAgreeArgs,
} from './viewpoint.interface';
import {
  DiscussTable,
  ViewPoint_Topic,
  VIEWPOINT_TYPE,
  VIEWPOINT_NO_TARGET,
  VIEWPOINT_NOT_REMOVED,
  ViewPoint_Group,
  ViewPoint_Idea,
  ViewPoint_Agree,
  ViewPoint_Disagree,
} from 'src/crud/Table.model';

class ViewPointSqlTools {
  static async getTopicNodeId(s: SqlService, topicId: number) {
    const [id] = await s.query<{
      id: number;
    }>(`
      SELECT id FROM viewpoint WHERE topic_id = ${topicId} AND type = '${VIEWPOINT_TYPE.TOPIC}';
      `);
    return String(id);
  }
  static async getGroupNodeId(
    s: SqlService,
    {
      student_id,
      topic_id,
    }: {
      student_id: number;
      topic_id: number;
    },
  ) {
    const sql = `
    SELECT
      vp.id 
    FROM
      viewpoint vp
      JOIN student s ON s.id = ${student_id} 
    WHERE
      vp.group_id = s.group_id 
      AND vp.topic_id = ${topic_id};`;
    const [id] = await s.query<{
      id: number;
    }>(sql);
    return String(id.id);
  }
}

@Injectable()
export class ViewpointService extends SqlService {
  async createTopic(args: CreateTopicArgs) {
    const { content, class_id, creator_id, status } = args;

    await this.transaction(async () => {
      /**
       * 在Discussion表中插入一条记录
       */
      const insertDiscussionId = await this.insert(
        this.generateInsertSql<DiscussTable>(
          'discussion',
          [
            'topic_content',
            'created_time',
            'created_user_id',
            'topic_for_class_id',
            'status',
          ],
          [[content, 'NOW', creator_id, class_id, status]],
        ),
      );
      /**
       * 在viewpoint表中插入一条TOPIC记录
       */
      const insertTopicId = await this.insert(
        this.generateInsertSql<ViewPoint_Topic>(
          'viewpoint',
          ['type', 'topic_id', 'created_time', 'removed', 'class_id', 'target'],
          [
            [
              VIEWPOINT_TYPE.TOPIC,
              insertDiscussionId,
              'NOW',
              VIEWPOINT_NOT_REMOVED,
              class_id,
              VIEWPOINT_NO_TARGET,
            ],
          ],
        ),
      );
      /**
       * 在Viewpoint表中插入类型为group的所有记录
       */
      // 1. 查询出对应班级所有的group
      const queryAllGroupSql = `
      SELECT
        id 
      FROM
        \`group\` gt 
      WHERE
        gt.belong_class_id = ${class_id};
      `;
      const allGroupIds = await this.query<{
        id: number;
      }>(queryAllGroupSql);
      // 2. 创建所有的group节点
      await this.insert(
        this.generateInsertSql<ViewPoint_Group>(
          'viewpoint',
          ['group_id', 'removed', 'target', 'topic_id', 'type', 'created_time'],
          allGroupIds.map((item) => [
            item.id,
            VIEWPOINT_NOT_REMOVED,
            insertTopicId,
            insertDiscussionId,
            VIEWPOINT_TYPE.GROUP,
            'NOW',
          ]),
        ),
      );
    });
    return {
      data: {},
      message: '创建成功',
    };
  }
  async createIdea(args: CreateIdeaArgs) {
    const {
      topic_id,
      student_id,
      idea_conclusion,
      idea_reason,
      idea_limitation,
    } = args;
    await this.transaction(async () => {
      const groupNodeId = await ViewPointSqlTools.getGroupNodeId(this, {
        student_id,
        topic_id,
      });
      // 创建一个idea连接到groupViewPoint上
      await this.insert(
        this.generateInsertSql<ViewPoint_Idea>(
          'viewpoint',
          [
            'topic_id',
            'student_id',
            'created_time',
            'idea_conclusion',
            'idea_limitation',
            'idea_reason',
            'removed',
            'target',
            'type',
          ],
          [
            [
              topic_id,
              student_id,
              'NOW',
              idea_conclusion,
              idea_limitation,
              idea_reason,
              VIEWPOINT_NOT_REMOVED,
              groupNodeId,
              VIEWPOINT_TYPE.IDEA,
            ],
          ],
        ),
      );
    });
    return {
      data: {},
      message: '创建成功',
    };
  }
  async createAgree(args: CreateAgreeArgs) {
    const {
      topic_id,
      student_id,
      agree_reason,
      agree_supplement,
      agree_viewpoint,
      target,
    } = args;
    await this.transaction(async () => {
      await this.insert(
        this.generateInsertSql<ViewPoint_Agree>( // 假设同意记录也使用 ViewPoint_Idea 类型
          'viewpoint',
          [
            'topic_id',
            'student_id',
            'created_time',
            'agree_reason',
            'agree_supplement',
            'agree_viewpoint',
            'removed',
            'target',
            'type',
          ],
          [
            [
              topic_id,
              student_id,
              'NOW',
              agree_reason,
              agree_supplement,
              agree_viewpoint,
              VIEWPOINT_NOT_REMOVED,
              target,
              VIEWPOINT_TYPE.AGREE, // 假设有一个 AGREEMENT 类型
            ],
          ],
        ),
      );
      // 创建一个同意连接到指定的观点上
    });
    return {
      data: {},
    };
  }
  async createDisAgree(args: CreateDisAgreeArgs) {
    const {
      topic_id,
      student_id,
      disagree_reason,
      disagree_suggestion,
      disagree_viewpoint,
      target,
    } = args;
    await this.transaction(async () => {
      await this.insert(
        this.generateInsertSql<ViewPoint_Disagree>( // 假设不同意记录也使用 ViewPoint_Idea 类型
          'viewpoint',
          [
            'topic_id',
            'student_id',
            'created_time',
            'disagree_reason',
            'disagree_suggestion',
            'disagree_viewpoint',
            'removed',
            'target',
            'type',
          ],
          [
            [
              topic_id,
              student_id,
              'NOW',
              disagree_reason,
              disagree_suggestion,
              disagree_viewpoint,
              VIEWPOINT_NOT_REMOVED,
              target,
              VIEWPOINT_TYPE.DISAGREE,
            ],
          ],
        ),
      );
      // 创建一个不同意连接到指定的观点上
    });
    return {
      data: {},
    };
  }
}
