import { Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
import { CreateTopicArgs } from './viewpoint.interface';
import {
  DiscussTable,
  ViewPoint_Topic,
  VIEWPOINT_TYPE,
  VIEWPOINT_NO_TARGET,
  VIEWPOINT_NOT_REMOVED,
  ViewPoint_Group,
} from 'src/crud/Table.model';

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
}
