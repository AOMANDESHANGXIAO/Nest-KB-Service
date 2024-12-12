import { Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
import {
  CreateTopicArgs,
  CreateIdeaArgs,
  CreateAgreeArgs,
  CreateDisAgreeArgs,
  CreateAskArgs,
  CreateResponseArgs,
  GetTopicArgs,
  GetContentArgs,
  GetViewPointListArgs,
  UpdateIdeaArgs,
  UpdateAgreeArgs,
  UpdateDisAgreeArgs,
  UpdateGroupArgs,
  UpdateResponseArgs,
  // GetViewPointListArgs,
} from './viewpoint.args';
import {
  DiscussTable,
  ViewPoint_Topic,
  VIEWPOINT_TYPE,
  VIEWPOINT_NO_TARGET,
  ViewPoint_Group,
  ViewPoint_Idea,
  ViewPoint_Agree,
  ViewPoint_Disagree,
  ViewPoint_Ask,
  ViewPoint_Response,
  ViewPoint_Update_Log,
} from 'src/crud/Table.model';
import { viewpointLogger } from './viewpoint.logger';
import { BLUE, GREEN, YELLOW, RED, PURPLE } from './viewpoint.constant';
import { VIEWPOINT_NOT_REMOVED } from '../crud/Table.model';
import { escapeSqlString } from 'src/utils/escapeString';
import { UpdateAskArgs } from './viewpoint.args';

class ViewPointColorHandle {
  static getColor(type: VIEWPOINT_TYPE) {
    switch (type) {
      case VIEWPOINT_TYPE.IDEA: {
        return BLUE;
      }
      case VIEWPOINT_TYPE.AGREE: {
        return GREEN;
      }
      case VIEWPOINT_TYPE.DISAGREE: {
        return RED;
      }
      case VIEWPOINT_TYPE.RESPONSE: {
        return PURPLE;
      }
      case VIEWPOINT_TYPE.ASK: {
        return YELLOW;
      }
    }
  }
}

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
  async queryViewPointList(args: GetViewPointListArgs) {
    const { topic_id, student_id } = args;
    const sql = `
    SELECT
      vp.id,
      vp.type,
      vp.student_id,
      vp.target,
      vp.created_time,
      vp.group_id,
      vp.idea_conclusion,
      s.color,
      s.nickname,
      s.group_id as student_group_id,
      g.group_name,
      g.group_color,
      d.topic_content,
      vp2.student_id as target_student_id,
      s2.nickname as target_student_name 
    FROM
      viewpoint vp
      LEFT JOIN viewpoint vp2 ON vp2.id = vp.target
      LEFT JOIN student s2 ON s2.id = vp2.student_id
      LEFT JOIN student s ON s.id = vp.student_id
      LEFT JOIN \`group\` g ON g.id = vp.group_id
      LEFT JOIN discussion d ON d.id = vp.topic_id 
      AND vp.type = 'topic' 
    WHERE
      vp.topic_id = ${topic_id};`;
    const list = await this.query<{
      id: number;
      type: VIEWPOINT_TYPE;
      student_id: number;
      target: number;
      created_time: Date;
      group_id: number;
      idea_conclusion: string;
      color: string;
      nickname: string;
      student_group_id: number;
      group_name: string;
      group_color: string;
      topic_content: string;
      target_student_id: number;
      target_student_name: string;
    }>(sql);
    const nodes = list.map((item) => {
      if (item.type === VIEWPOINT_TYPE.TOPIC) {
        return {
          id: String(item.id),
          type: item.type,
          data: {
            id: String(item.id),
            text: item.topic_content,
          },
          position: {
            x: 0,
            y: 0,
          },
        };
      } else if (item.type === VIEWPOINT_TYPE.GROUP) {
        return {
          id: String(item.id),
          type: item.type,
          data: {
            id: String(item.id),
            groupName: item.group_name,
            groupConclusion: item.idea_conclusion,
            bgc: item.group_color,
            group_id: String(item.group_id),
            node_id: String(item.id), // 新增一个字段，用于传递小组节点的Node_id
          },
          position: {
            x: 0,
            y: 0,
          },
        };
      } else {
        return {
          id: String(item.id),
          type: item.type,
          position: {
            x: 0,
            y: 0,
          },
          data: {
            type: item.type,
            name: item.nickname,
            id: String(item.id),
            bgc: ViewPointColorHandle.getColor(item.type),
            student_id: String(item.student_id),
          },
        };
      }
    });
    const targetIsStudentNodeIds = list
      .filter((item) => String(item.target_student_id) === String(student_id))
      .map((item) => String(item.id));
    const edges = list
      .filter((item) => item.target !== VIEWPOINT_NO_TARGET)
      .map((item) => {
        return {
          id: String(item.id) + '=>' + String(item.target),
          source: String(item.id),
          target: String(item.target),
          _type: item.type,
          // 添加功能，如果是指向自己的节点那么将animated设置为true
          animated: targetIsStudentNodeIds.includes(String(item.target)),
        };
      });
    // 找到当前id的student回复过的所有ViewPoint的id
    const ids = list
      .filter((item) => item.student_id === student_id)
      .map((item) => item.target);
    // console.log('当前学生回复过的观点ids ==>', ids);
    // 找到当前学生还没有回复过的ViewPoint
    const notResponsed = list
      .filter((item) =>
        // 过滤出支持、反对、困惑、回应的viewpoint
        [
          VIEWPOINT_TYPE.AGREE,
          VIEWPOINT_TYPE.ASK,
          VIEWPOINT_TYPE.DISAGREE,
          VIEWPOINT_TYPE.RESPONSE,
        ].includes(item.type),
      )
      // 过滤出当前学生没有回复过的
      .filter(
        (item) =>
          // 第一个条件是不能回复的是自己，第二个条件是没有回复过的
          String(item.target_student_id) === String(student_id) &&
          !ids.includes(item.id),
      )
      .map((item) => {
        return {
          type: item.type,
          id: String(item.id),
          name: item.nickname,
        };
      });

    return {
      data: {
        nodes,
        edges,
        notResponsed,
      },
    };
  }
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
      const columnValues = allGroupIds.map((item) => [
        item.id,
        VIEWPOINT_NOT_REMOVED,
        insertTopicId,
        insertDiscussionId,
        VIEWPOINT_TYPE.GROUP,
        'NOW',
        '',
        '',
        '',
      ]);
      if (columnValues.length) {
        await this.insert(
          this.generateInsertSql<ViewPoint_Group>(
            'viewpoint',
            [
              'group_id',
              'removed',
              'target',
              'topic_id',
              'type',
              'created_time',
              'idea_conclusion',
              'idea_limitation',
              'idea_reason',
            ],
            columnValues,
          ),
        );
      }
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
    let id: string = '';
    await this.transaction(async () => {
      const groupNodeId = await ViewPointSqlTools.getGroupNodeId(this, {
        student_id,
        topic_id,
      });
      // 创建一个idea连接到groupViewPoint上
      const viewpoint_id = await this.insert(
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
      id = viewpoint_id;
      viewpointLogger.pubsub.publish('createViewPoint', {
        service: this,
        student_id,
        viewpoint_id: Number(viewpoint_id),
      });
    });
    return {
      data: {
        id: String(id),
      },
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
    let id: string = '';
    await this.transaction(async () => {
      const viewpoint_id = await this.insert(
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
      id = viewpoint_id;
      viewpointLogger.pubsub.publish('createViewPoint', {
        service: this,
        student_id,
        viewpoint_id: Number(viewpoint_id),
      });
    });
    return {
      data: {
        id: String(id),
      },
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
    let id: string = '';
    await this.transaction(async () => {
      const viewpoint_id = await this.insert(
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
      id = viewpoint_id;
      // 创建一个不同意连接到��定的观点上
      viewpointLogger.pubsub.publish('createViewPoint', {
        service: this,
        student_id,
        viewpoint_id: Number(viewpoint_id),
      });
    });
    return {
      data: {
        id: String(id),
      },
    };
  }
  async createAsk(args: CreateAskArgs) {
    const { topic_id, student_id, ask_question, target } = args;
    let id_ = '';
    await this.transaction(async () => {
      const id = await this.insert(
        this.generateInsertSql<ViewPoint_Ask>( // 假设 Ask 记录也使用 ViewPoint_Idea 类型
          'viewpoint',
          [
            'topic_id',
            'student_id',
            'created_time',
            'ask_question',
            'removed',
            'target',
            'type',
          ],
          [
            [
              topic_id,
              student_id,
              'NOW',
              ask_question,
              VIEWPOINT_NOT_REMOVED,
              target,
              VIEWPOINT_TYPE.ASK,
            ],
          ],
        ),
      );
      id_ = id;
      viewpointLogger.pubsub.publish('createViewPoint', {
        service: this,
        student_id,
        viewpoint_id: Number(id),
      });
    });
    return {
      data: {
        id: String(id_),
      },
      message: '提问成功',
    };
  }
  async createResponse(args: CreateResponseArgs) {
    const { topic_id, student_id, response_content, target } = args;
    let id_ = '';
    await this.transaction(async () => {
      const id = await this.insert(
        this.generateInsertSql<ViewPoint_Response>( // 假设 Response 记录使用 ViewPoint_Response 类型
          'viewpoint',
          [
            'topic_id',
            'student_id',
            'created_time',
            'response_content',
            'removed',
            'target',
            'type',
          ],
          [
            [
              topic_id,
              student_id,
              'NOW',
              response_content,
              VIEWPOINT_NOT_REMOVED,
              target,
              VIEWPOINT_TYPE.RESPONSE, // 假设有一个 RESPONSE 类型
            ],
          ],
        ),
      );
      id_ = id;
      viewpointLogger.pubsub.publish('createViewPoint', {
        service: this,
        student_id,
        viewpoint_id: Number(id),
      });
    });
    return {
      data: {
        id: String(id_),
      },
      message: '响应成功',
    };
  }
  async getTopic(args: GetTopicArgs) {
    const { topic_id } = args;
    const sql = `
    SELECT
      topic_content AS content,
      \`status\`
    FROM
      discussion 
    WHERE
      id = ${topic_id};`;
    const [res] = await this.query<{
      content: string;
      status: string;
    }>(sql);
    return {
      data: {
        content: res.content,
        status: res.status,
      },
    };
  }
  async getGroup(args: GetContentArgs) {
    const { id, student_id } = args;
    const sql = `
    SELECT
      vp.idea_conclusion,
      vp.idea_reason,
      vp.idea_limitation,
      vp.target target_viewpoint_id
    FROM
      viewpoint vp
    WHERE
      vp.id = ${id}`;
    const [res] = await this.query<{
      idea_conclusion: string;
      idea_reason: string;
      idea_limitation: string;
      target_viewpoint_id: number;
    }>(sql);
    /**
     * 发布消息
     */
    viewpointLogger.pubsub.publish('checkViewPoint', {
      service: this,
      checked_viewpoint_id: id,
      student_id: student_id,
    });
    return {
      data: {
        list: [
          {
            title: '结论',
            key: 'idea_conclusion',
            value: res.idea_conclusion,
          },
          {
            title: '原因',
            key: 'idea_reason',
            value: res.idea_reason,
          },
          {
            title: '局限性',
            key: 'idea_limitation',
            value: res.idea_limitation,
          },
        ].filter((item) => item.value),
        target_viewpoint_id: String(res.target_viewpoint_id),
      },
    };
  }
  async getIdea(args: GetContentArgs) {
    const { id, student_id } = args;
    const sql = `
    SELECT
      vp.idea_conclusion,
      vp.idea_reason,
      vp.idea_limitation,
      vp.target
    FROM
      viewpoint vp
    WHERE
      vp.id = ${id}`;
    const [res] = await this.query<{
      idea_conclusion: string;
      idea_reason: string;
      idea_limitation: string;
      target: number;
    }>(sql);
    /**
     * 发布消息
     */
    viewpointLogger.pubsub.publish('checkViewPoint', {
      service: this,
      checked_viewpoint_id: id,
      student_id: student_id,
    });
    return {
      data: {
        list: [
          {
            title: '结论',
            key: 'idea_conclusion',
            value: res.idea_conclusion,
          },
          {
            title: '原因',
            key: 'idea_reason',
            value: res.idea_reason,
          },
          {
            title: '局限性',
            key: 'idea_limitation',
            value: res.idea_limitation,
          },
        ].filter((item) => item.value),
        target_viewpoint_id: String(res.target),
      },
    };
  }
  async getAgree(args: GetContentArgs) {
    const { id, student_id } = args;
    const sql = `
    SELECT
      vp.agree_viewpoint,
      vp.agree_reason,
      vp.agree_supplement,
      vp.target target_viewpoint_id,
      vp2.student_id target_student_id
    FROM
      viewpoint vp
      JOIN viewpoint vp2 ON vp2.id = vp.target 
    WHERE
      vp.id = ${id}`;
    const [res] = await this.query<{
      agree_viewpoint: string;
      agree_reason: string;
      agree_supplement: string;
      target_viewpoint_id: number;
      target_student_id: number;
    }>(sql);

    viewpointLogger.pubsub.publish('checkViewPoint', {
      service: this,
      checked_viewpoint_id: id,
      student_id,
    });
    return {
      data: {
        list: [
          {
            title: '同意的点',
            key: 'agree_viewpoint',
            value: res.agree_viewpoint,
          },
          {
            title: '原因',
            key: 'agree_reason',
            value: res.agree_reason,
          },
          {
            title: '可改进点',
            key: 'agree_supplement',
            value: res.agree_supplement,
          },
        ].filter((item) => item.value !== ''),
        target_viewpoint_id: String(res.target_viewpoint_id),
        target_student_id: String(res.target_student_id),
      },
    };
  }
  async getDisAgree(args: GetContentArgs) {
    const { id, student_id } = args;
    const sql = `
    SELECT
      vp.disagree_viewpoint,
      vp.disagree_reason,
      vp.disagree_suggestion,
      vp.target target_viewpoint_id,
      vp2.student_id target_student_id
    FROM
      viewpoint vp
      JOIN viewpoint vp2 ON vp2.id = vp.target 
    WHERE
      vp.id = ${id}`;
    const [res] = await this.query<{
      disagree_viewpoint: string;
      disagree_reason: string;
      disagree_suggestion: string;
      target_viewpoint_id: number;
      target_student_id: number;
    }>(sql);
    viewpointLogger.pubsub.publish('checkViewPoint', {
      service: this,
      checked_viewpoint_id: id,
      student_id,
    });
    return {
      data: {
        list: [
          {
            title: '不同意的点',
            key: 'disagree_viewpoint',
            value: res.disagree_viewpoint,
          },
          {
            title: '原因',
            key: 'disagree_reason',
            value: res.disagree_reason,
          },
          {
            title: '改进意见',
            key: 'disagree_suggestion',
            value: res.disagree_suggestion,
          },
        ].filter((item) => item.value !== ''),
        target_viewpoint_id: String(res.target_viewpoint_id),
        target_student_id: String(res.target_student_id),
      },
    };
  }
  async getAsk(args: GetContentArgs) {
    const { id, student_id } = args;
    const sql = `
    SELECT
      vp.ask_question,
      vp.target target_viewpoint_id,
      vp2.student_id target_student_id
    FROM
      viewpoint vp
      JOIN viewpoint vp2 ON vp2.id = vp.target 
   WHERE
      vp.id = ${id}`;
    const [res] = await this.query<{
      ask_question: string;
      target_viewpoint_id: number;
      target_student_id: number;
    }>(sql);
    viewpointLogger.pubsub.publish('checkViewPoint', {
      service: this,
      checked_viewpoint_id: id,
      student_id,
    });
    return {
      data: {
        list: [
          {
            title: '疑惑的点',
            key: 'ask_question',
            value: res.ask_question,
          },
        ].filter((item) => item.value !== ''),
        target_viewpoint_id: String(res.target_viewpoint_id),
        target_student_id: String(res.target_student_id),
      },
    };
  }
  async getResponse(args: GetContentArgs) {
    const { id, student_id } = args;
    const sql = `
    SELECT
      vp.response_content,
      vp.target target_viewpoint_id,
      vp2.student_id target_student_id
    FROM
      viewpoint vp
      JOIN viewpoint vp2 ON vp2.id = vp.target 
      WHERE
      vp.id = ${id}`;
    const [res] = await this.query<{
      response_content: string;
      target_viewpoint_id: number;
      target_student_id: number;
    }>(sql);
    viewpointLogger.pubsub.publish('checkViewPoint', {
      service: this,
      checked_viewpoint_id: id,
      student_id,
    });
    return {
      data: {
        list: [
          {
            title: '回应的内容',
            key: 'response_content',
            value: res.response_content,
          },
        ].filter((item) => item.value !== ''),
        target_viewpoint_id: String(res.target_viewpoint_id),
        target_student_id: String(res.target_student_id),
      },
    };
  }
  async updateIdea(args: UpdateIdeaArgs) {
    const { student_id, id, idea_conclusion, idea_limitation, idea_reason } =
      args;
    await this.transaction(async () => {
      /**
       * 先将以前的查询出来
       */
      const sql = `
    SELECT
      vp.idea_conclusion,
      vp.idea_limitation,
      vp.idea_reason 
    FROM
      viewpoint vp 
    WHERE
      id = ${id};
    `;
      const [oldValue] = await this.query<{
        idea_conclusion: string;
        idea_limitation: string;
        idea_reason: string;
      }>(sql);
      /**
       * 先存储oldValue
       */
      await this.insert(
        this.generateInsertSql<ViewPoint_Update_Log>(
          'viewpoint_update_log',
          [
            'idea_conclusion',
            'idea_limitation',
            'idea_reason',
            'removed',
            'created_time',
            'viewpoint_id',
          ],
          [
            [
              oldValue.idea_conclusion,
              oldValue.idea_limitation,
              oldValue.idea_reason,
              VIEWPOINT_NOT_REMOVED,
              'NOW',
              id,
            ],
          ],
        ),
      );
      /**
       * 更新
       */
      const updateSql = `
    UPDATE viewpoint SET
      idea_conclusion = '${escapeSqlString(idea_conclusion)}',
      idea_limitation = '${escapeSqlString(idea_limitation)}',
      idea_reason = '${escapeSqlString(idea_reason)}'
    WHERE id = ${id}
    `;
      await this.update(updateSql);
      viewpointLogger.pubsub.publish('updateViewPoint', {
        service: this,
        student_id: student_id,
        viewpoint_id: id,
      });
    });

    return {
      data: {
        id: String(id),
      },
      message: '修改成功',
    };
  }
  async updateGroup(args: UpdateGroupArgs) {
    const { student_id, id, idea_conclusion, idea_limitation, idea_reason } =
      args;
    console.log('UpdateGroupArgs', args);
    await this.transaction(async () => {
      // ... existing code for fetching old values ...
      const sql = `
    SELECT
      vp.idea_conclusion,
      vp.idea_limitation,
      vp.idea_reason 
    FROM
      viewpoint vp 
    WHERE
      id = ${id};
    `;
      const [oldValue] = await this.query<{
        idea_conclusion: string;
        idea_limitation: string;
        idea_reason: string;
      }>(sql);
      // ... existing code for storing old values ...
      await this.insert(
        this.generateInsertSql<ViewPoint_Update_Log>(
          'viewpoint_update_log',
          [
            'idea_conclusion',
            'idea_limitation',
            'idea_reason',
            'removed',
            'created_time',
            'viewpoint_id',
          ],
          [
            [
              oldValue.idea_conclusion || '',
              oldValue.idea_limitation || '',
              oldValue.idea_reason || '',
              VIEWPOINT_NOT_REMOVED,
              'NOW',
              id,
            ],
          ],
        ),
      );
      // ... existing code for updating ...
      const updateSql = `
    UPDATE viewpoint SET
      idea_conclusion = '${escapeSqlString(idea_conclusion)}',
      idea_limitation = '${escapeSqlString(idea_limitation)}',
      idea_reason = '${escapeSqlString(idea_reason)}'
    WHERE id = ${id}
    `;
      await this.update(updateSql);
      viewpointLogger.pubsub.publish('updateViewPoint', {
        service: this,
        student_id: student_id,
        viewpoint_id: id,
      });
    });

    return {
      data: {
        id: String(id),
      },
      message: '修改成功',
    };
  }
  async updateAgree(args: UpdateAgreeArgs) {
    const { student_id, id, agree_reason, agree_supplement, agree_viewpoint } =
      args;
    await this.transaction(async () => {
      // ... existing code for fetching old values ...
      const sql = `
    SELECT
      vp.agree_reason,
      vp.agree_supplement,
      vp.agree_viewpoint 
    FROM
      viewpoint vp 
    WHERE
      id = ${id};
    `;
      const [oldValue] = await this.query<{
        agree_reason: string;
        agree_supplement: string;
        agree_viewpoint: string;
      }>(sql);
      // ... existing code for storing old values ...
      await this.insert(
        this.generateInsertSql<ViewPoint_Update_Log>(
          'viewpoint_update_log',
          [
            'agree_reason',
            'agree_supplement',
            'agree_viewpoint',
            'removed',
            'created_time',
            'viewpoint_id',
          ],
          [
            [
              oldValue.agree_reason,
              oldValue.agree_supplement,
              oldValue.agree_viewpoint,
              VIEWPOINT_NOT_REMOVED,
              'NOW',
              id,
            ],
          ],
        ),
      );
      // ... existing code for updating ...
      const updateSql = `
    UPDATE viewpoint SET
      agree_reason = '${escapeSqlString(agree_reason)}',
      agree_supplement = '${escapeSqlString(agree_supplement)}',
      agree_viewpoint = '${escapeSqlString(agree_viewpoint)}'
    WHERE id = ${id}
    `;
      await this.update(updateSql);
      viewpointLogger.pubsub.publish('updateViewPoint', {
        service: this,
        student_id: student_id,
        viewpoint_id: id,
      });
    });

    return {
      data: {
        id: String(id),
      },
      message: '修改成功',
    };
  }
  async updateDisagree(args: UpdateDisAgreeArgs) {
    const {
      student_id,
      id,
      disagree_reason,
      disagree_suggestion,
      disagree_viewpoint,
    } = args;
    await this.transaction(async () => {
      // ... existing code for fetching old values ...
      const sql = `
    SELECT
      vp.disagree_reason,
      vp.disagree_suggestion,
      vp.disagree_viewpoint 
    FROM
      viewpoint vp 
    WHERE
      id = ${id};
    `;
      const [oldValue] = await this.query<{
        disagree_reason: string;
        disagree_suggestion: string;
        disagree_viewpoint: string;
      }>(sql);
      // ... existing code for storing old values ...
      await this.insert(
        this.generateInsertSql<ViewPoint_Update_Log>(
          'viewpoint_update_log',
          [
            'disagree_reason',
            'disagree_suggestion',
            'disagree_viewpoint',
            'removed',
            'created_time',
            'viewpoint_id',
          ],
          [
            [
              oldValue.disagree_reason,
              oldValue.disagree_suggestion,
              oldValue.disagree_viewpoint,
              VIEWPOINT_NOT_REMOVED,
              'NOW',
              id,
            ],
          ],
        ),
      );
      // ... existing code for updating ...
      const updateSql = `
    UPDATE viewpoint SET
      disagree_reason = '${escapeSqlString(disagree_reason)}',
      disagree_suggestion = '${escapeSqlString(disagree_suggestion)}',
      disagree_viewpoint = '${escapeSqlString(disagree_viewpoint)}'
    WHERE id = ${id}
    `;
      await this.update(updateSql);
      viewpointLogger.pubsub.publish('updateViewPoint', {
        service: this,
        student_id: student_id,
        viewpoint_id: id,
      });
    });

    return {
      data: {
        id: String(id),
      },
      message: '修改成功',
    };
  }
  async updateAsk(args: UpdateAskArgs) {
    const { student_id, id, ask_question } = args;
    await this.transaction(async () => {
      // ... existing code for fetching old values ...
      const sql = `
    SELECT
      vp.ask_question 
    FROM
      viewpoint vp 
    WHERE
      id = ${id};
    `;
      const [oldValue] = await this.query<{
        ask_question: string;
      }>(sql);
      // ... existing code for storing old values ...
      await this.insert(
        this.generateInsertSql<ViewPoint_Update_Log>(
          'viewpoint_update_log',
          ['ask_question', 'removed', 'created_time', 'viewpoint_id'],
          [[oldValue.ask_question, VIEWPOINT_NOT_REMOVED, 'NOW', id]],
        ),
      );
      // ... existing code for updating ...
      const updateSql = `
    UPDATE viewpoint SET
      ask_question = '${escapeSqlString(ask_question)}'
    WHERE id = ${id}
    `;
      await this.update(updateSql);
      viewpointLogger.pubsub.publish('updateViewPoint', {
        service: this,
        student_id: student_id,
        viewpoint_id: id,
      });
    });

    return {
      data: {
        id: String(id),
      },
      message: '修改成功',
    };
  }
  async updateResponse(args: UpdateResponseArgs) {
    const { student_id, id, response_content } = args;
    await this.transaction(async () => {
      // ... existing code for fetching old values ...
      const sql = `
    SELECT
      vp.response_content 
    FROM
      viewpoint vp 
    WHERE
      id = ${id};
    `;
      const [oldValue] = await this.query<{
        response_content: string;
      }>(sql);
      // ... existing code for storing old values ...
      await this.insert(
        this.generateInsertSql<ViewPoint_Update_Log>(
          'viewpoint_update_log',
          ['response_content', 'removed', 'created_time', 'viewpoint_id'],
          [[oldValue.response_content, VIEWPOINT_NOT_REMOVED, 'NOW', id]],
        ),
      );
      // ... existing code for updating ...
      const updateSql = `
    UPDATE viewpoint SET
      response_content = '${escapeSqlString(response_content)}'
    WHERE id = ${id}
    `;
      await this.update(updateSql);
      viewpointLogger.pubsub.publish('updateViewPoint', {
        service: this,
        student_id: student_id,
        viewpoint_id: id,
      });
    });

    return {
      data: {
        id: String(id),
      },
      message: '修改成功',
    };
  }
}
