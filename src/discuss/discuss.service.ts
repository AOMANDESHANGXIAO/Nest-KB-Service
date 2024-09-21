import { Injectable } from '@nestjs/common';
import { SqlService } from '../db';
import { DiscussTable } from 'src/crud/Table.model';
import { FindAllQueryInput } from './Models/index';
import DiscussionCRUDer from '../crud/Discussion';
import CreateDiscussion from './utils/createDiscussion';
import { QueryParams } from 'src/crud';
@Injectable()
export class DiscussService extends SqlService {
  discussCruder: DiscussionCRUDer;
  constructor() {
    super();
    this.discussCruder = new DiscussionCRUDer(this);
  }

  /**
   * TODO: 创建一个讨论话题✅
   * @returns
   */
  public async create({
    topic_content,
    created_user_id,
    topic_for_class_id,
  }: {
    topic_content: string;
    created_user_id: number;
    topic_for_class_id: number;
  }) {
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

  updateDiscuss(id: number) {
    return `This action updates a #${id} discuss`;
  }

  remove(id: number) {
    return `This action removes a #${id} discuss`;
  }
}
