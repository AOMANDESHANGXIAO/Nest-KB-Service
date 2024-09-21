import { SqlService } from 'src/db';
/**
 * 创建discussion辅助
 */
export default class CreateDiscussion {
  static async queryGroupsByClassId(s: SqlService, id: number) {
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
      g.belong_class_id = ${id}`;
    return await s.query<{
      id: number;
      group_name: string;
      group_description: string;
      group_code: string;
      group_color: string;
    }>(sql);
  }
  /**
   * 在node表中创建节点
   * id 为 topicId
   */
  static async createGroupNodeInNodeTable(
    s: SqlService,
    params: {
      topicId: number;
      classId: number;
      list: Array<{
        group_id: number;
        [key: string]: any;
      }>;
    },
  ) {
    const { topicId, classId, list } = params;
    const values = list.map((item) => [
      'group',
      classId,
      item.group_id,
      topicId,
      'NOW',
      1,
    ]);

    return await s.insert(
      s.generateInsertSql(
        'node_table',
        ['type', 'class_id', 'group_id', 'topic_id', 'created_time', 'version'],
        values,
      ),
    );
  }

  /**
   * 在edge表中创建边
   */
  static async createEdgeInEdgeTable(
    s: SqlService,
    params: {
      topicNodeId: number;
      topicId: number;
    },
  ) {
    const { topicNodeId, topicId } = params;
    // 1. 查询出创建好的小组节点
    const sqlQueryGroupNode = `
    SELECT
      n.id,
      n.group_id 
    FROM
      node_table n 
    WHERE
      n.topic_id = ${topicId} 
    AND n.type = 'group'`;
    const groupNodes = await s.query<{ id: number; group_id: number }>(
      sqlQueryGroupNode,
    );
    // 2. 创建边
    await s.insert(
      s.generateInsertSql(
        'edge_table',
        ['source', 'target', 'type', 'topic_id'],
        groupNodes.map((item) => [
          item.id,
          topicNodeId,
          'group_to_discuss',
          topicId,
        ]),
      ),
    );
  }
}
