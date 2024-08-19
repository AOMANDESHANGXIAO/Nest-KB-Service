import { SqlService } from 'src/db';
import { CRUDer } from './index';
import { NodeTable, NodeTypeEnum } from './Table.model';
import { IdeaType, TopicType, GroupType } from './NodeTable.type';

export default class NodeCRUDer implements CRUDer {
  s: SqlService;
  constructor(sqlService: SqlService) {
    this.s = sqlService;
  }

  /**
   *
   * @returns insertId
   */
  public async createOne({
    topic_id,
    type,
    student_id,
    version = 1,
  }: Pick<
    NodeTable,
    'topic_id' | 'type' | 'student_id' | 'version'
  >): Promise<string> {
    return await this.s.insert(
      this.s.generateInsertSql(
        'node_table',
        ['topic_id', 'type', 'student_id', 'created_time', 'version'],
        [[topic_id, type, student_id, 'NOW', version]],
      ),
    );
  }

  public async selectOneTypeByTopicId({
    topic_id,
    type,
  }: {
    topic_id: number;
    type: NodeTypeEnum.idea;
  }): Promise<IdeaType[]>; // Overload for 'idea'
  public async selectOneTypeByTopicId({
    topic_id,
    type,
  }: {
    topic_id: number;
    type: NodeTypeEnum.topic;
  }): Promise<TopicType[]>; // Overload for 'topic'
  public async selectOneTypeByTopicId({
    topic_id,
    type,
  }: {
    topic_id: number;
    type: NodeTypeEnum.group;
  }): Promise<GroupType[]>; // Overload for 'group'

  public async selectOneTypeByTopicId({
    topic_id,
    type,
  }: Pick<NodeTable, 'topic_id' | 'type'>): Promise<any> {
    switch (type) {
      case 'idea': {
        const sql = `
        SELECT
          t1.id node_id,
          t1.content,
          t2.nickname,
          t3.group_color,
          t2.id 
        FROM
          node_table t1
          LEFT JOIN student t2 ON t1.student_id = t2.id
          JOIN \`group\` t3 ON t3.id = t2.group_id 
        WHERE
          t1.type = '${type}' 
          AND t1.topic_id = ${topic_id};
        `;
        return await this.s.query<IdeaType>(sql);
      }
      case 'topic': {
        const sql = `
        SELECT
          t1.id,
          t1.content 
        FROM
          node_table t1 
        WHERE
          t1.topic_id = ${topic_id} 
          AND t1.type = '${type}';`;

        return await this.s.query<TopicType>(sql);
      }
      case 'group': {
        const sql = `
        SELECT
          t1.id node_id,
          t1.content,
          t2.group_name,
          t2.group_color,
          t2.id group_id
        FROM
          node_table t1
          JOIN \`group\` t2 ON t2.id = t1.group_id 
        WHERE
          t1.type = '${type}' 
          AND t1.topic_id = ${topic_id};
        `;
        return await this.s.query<GroupType>(sql);
      }
    }
  }
}
