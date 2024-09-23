import { Injectable, HttpException } from '@nestjs/common';
import { SqlService } from '../db';
import { DiscussTable, DiscussAction } from 'src/crud/Table.model';
import { FindAllQueryInput } from './Models/index';
import DiscussionCRUDer from '../crud/Discussion';
import CreateDiscussion from './utils/createDiscussion';
import { QueryParams } from 'src/crud';
import type {
  CreateDiscussionInput,
  UpdateDiscussion,
  QueryRate,
  UpdateRateInput,
} from './Models';
@Injectable()
export class DiscussService extends SqlService {
  discussCruder: DiscussionCRUDer;
  constructor() {
    super();
    this.discussCruder = new DiscussionCRUDer(this);
  }

  public async create({
    topic_content,
    created_user_id,
    topic_for_class_id,
  }: CreateDiscussionInput) {
    if (!topic_content || !created_user_id || !topic_for_class_id) {
      return this.failResponse('参数不全');
    }

    await this.transaction(async () => {
      // 1.1 插入一条记录到discussion表
      const newTopicId = await this.insert(
        this.generateInsertSql<DiscussTable>(
          'discussion',
          [
            'topic_content',
            'created_user_id',
            'topic_for_class_id',
            'created_time',
            'status',
          ],
          [
            [
              topic_content,
              created_user_id,
              topic_for_class_id,
              'NOW',
              'PROPOSE',
            ],
          ],
        ),
      );
      // 1.2 插入一个TopicNode到node表
      const newTopicNodeId = await this.insert(
        this.generateInsertSql(
          'node_table',
          [
            'type',
            'content',
            'class_id',
            'topic_id',
            'created_time',
            'version',
          ],
          [['topic', topic_content, topic_for_class_id, newTopicId, 'NOW', 1]],
        ),
      );

      // 2. 将所有的group节点连接到node表中
      // 2.1 查询所有的group
      const groups = await CreateDiscussion.queryGroupsByClassId(
        this,
        topic_for_class_id,
      );
      // 2.2 将所有的group插入到node_table表中
      await CreateDiscussion.createGroupNodeInNodeTable(this, {
        topicId: +newTopicId,
        classId: topic_for_class_id,
        list: groups.map((item) => ({
          group_id: item.id,
        })),
      });
      // 2.3 创建边
      await CreateDiscussion.createEdgeInEdgeTable(this, {
        topicNodeId: +newTopicNodeId,
        topicId: +newTopicId,
      });
    });
    return {
      data: {},
      message: '创建成功',
    };
  }

  public async findAllByClassId({
    class_id,
    content,
    sort,
  }: FindAllQueryInput) {
    const list = await this.discussCruder.queryDiscussionByClassId(
      class_id,
      sort,
      content,
    );

    return {
      data: {
        list,
      },
    };
  }

  /**
   *
   * @param id discuss id
   * @returns DiscussTable
   * @description 返回一个discuss的内容
   */
  public async findOne(id: number) {
    const [res] = await this.query<DiscussTable>(
      `SELECT id, topic_content, created_time FROM discussion WHERE id = ${id}`,
    );
    // console.log(res);
    return {
      data: res,
    };
  }

  public async findAll(params: QueryParams) {
    /**
     * 查询出所有的讨论
     */
    const sql = `
    SELECT
        d.id,
        a.nickname AS publisher,
        d.topic_content,
        d.created_time,
        d.created_user_id,
        d.topic_for_class_id,
        d.STATUS as status,
        c.class_name 
    FROM
        discussion d
        JOIN admin a ON a.id = d.created_user_id
        JOIN class c ON c.id = d.topic_for_class_id
    ORDER BY d.created_time ${params.sort ? params.sort : 'ASC'}
    LIMIT ${(params.page - 1) * params.pageSize}, ${params.pageSize};
    `;

    const list = await this.query<{
      id: number;
      publisher: string;
      topic_content: string;
      created_time: Date;
      created_user_id: number;
      topic_for_class_id: number;
      status: string;
      class_name: string;
    }>(sql);

    const [totalNum] = await this.query<{ total: number }>(
      `SELECT COUNT(*) as total FROM discussion;`,
    );

    return {
      data: {
        list,
        totalNum: totalNum.total,
      },
    };
  }

  /**
   * 推进一个讨论
   * @returns
   */
  public async updateDiscuss({
    topicId,
    status,
    operatorId,
  }: UpdateDiscussion) {
    // validate
    if (topicId == null || status == null || operatorId == null) {
      throw new HttpException('参数不全', 400);
    }
    const STATUS_LIST = ['feedback', 'summary', 'close'];
    if (!STATUS_LIST.includes(status)) {
      throw new HttpException('Status参数不合法', 400);
    }
    await this.transaction(async () => {
      // 1. 首先更新discuss表
      await this.update(
        this.generateUpdateSql(
          'discussion',
          [{ column: 'status', value: status }],
          [{ column: 'id', value: topicId, charset: '=' }],
        ),
      );
      // 2. 更新discuss_action表
      await this.insert(
        this.generateInsertSql<DiscussAction>(
          'discuss_action',
          ['action', 'discuss_id', 'created_time', 'operator_id'],
          [[status, topicId, 'NOW', operatorId]],
        ),
      );
    });
    return {
      data: {},
      message: '操作成功',
    };
  }

  // TODO: 实现对话题进行评分API
  async rate({
    recognition,
    understanding,
    evaluation,
    analysis,
    create,
    node_table_id,
    version,
  }: UpdateRateInput) {
    // 参数校验
    if (
      typeof +node_table_id !== 'number' ||
      typeof +version !== 'number' ||
      typeof +recognition !== 'number' ||
      typeof +understanding !== 'number' ||
      typeof +evaluation !== 'number' ||
      typeof +analysis !== 'number' ||
      typeof +create !== 'number'
    ) {
      throw new HttpException('参数不合法', 400);
    }
    await this.transaction(async () => {
      const sql = `INSERT INTO \`node_table_score\` (version,recognition,understanding,evaluation,analysis,\`create\`,node_table_id,created_time)
       VALUES (${version},${recognition},${understanding},${evaluation},${analysis},${create},${node_table_id},NOW());`;
      await this.insert(sql);
    });
    return {
      data: {},
      message: '评分成功',
    };
  }

  /**
   * 查询所有的观点及其分数情况
   */
  async queryRate({ topicId, groupId, ideaType, publisherId }: QueryRate) {
    // 根据topicId查询
    if (!topicId || typeof +topicId !== 'number') {
      throw new HttpException('参数不合法', 400);
    }

    const ideaTypeList = ['idea', 'group'];
    if (ideaType && !ideaTypeList.includes(ideaType)) {
      throw new HttpException('ideaType参数不合法', 400);
    }

    let sql = `
    SELECT
      n.id,
      n.type,
      n.student_id,
      n.created_time,
      g.id as group_id,
      g.group_name,
      s.nickname,
      ns.recognition,
      ns.understanding,
      ns.evaluation,
      ns.analysis,
      ns.\`create\`,
      a.version,
      a.content 
    FROM
      node_table n
      LEFT JOIN node_table_score ns ON ns.node_table_id = n.id
      LEFT JOIN student s ON s.id = n.student_id
      LEFT JOIN \`group\` g ON g.id = s.group_id or g.id = n.group_id
      JOIN argunode a ON a.arguKey = n.id 
	    AND a.type = 'claim'
    WHERE
      n.topic_id = ${topicId} 
      AND n.type != 'topic'`;

    if (ideaType) {
      sql += ideaType ? ` AND n.type = '${ideaType}'` : '';
    }
    if (groupId) {
      sql += groupId ? ` AND g.id = ${groupId}` : '';
    }
    if (publisherId) {
      sql += publisherId ? ` AND s.id = ${publisherId}` : '';
    }
    sql += ';';

    const list = await this.query<{
      id: number;
      type: string;
      student_id: number;
      nickname: string;
      created_time: Date;
      group_id: number;
      group_name: string;
      version: number;
      content: string;
      recognition: number;
      understanding: number;
      evaluation: number;
      analysis: number;
      create: number;
    }>(sql);
    return {
      data: {
        // 如果未进行评分，则recognition等为null，这时要设置为0
        list: list.map((item, index) => {
          return {
            renderId: index,
            ...item,
            recognition: item.recognition || 0,
            understanding: item.understanding || 0,
            evaluation: item.evaluation || 0,
            analysis: item.analysis || 0,
            create: item.create || 0,
          };
        }),
      },
    };
  }

  remove(id: number) {
    return `This action removes a #${id} discuss`;
  }
}
