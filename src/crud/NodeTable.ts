import { SqlService } from 'src/db';
import { CRUDer } from './index';
import { NodeTable, NodeTypeEnum } from './Table.model';
import { IdeaType, TopicType, GroupType, QuestionType } from './NodeTable.type';

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
  }: {
    topic_id: number;
    type: NodeTypeEnum.question; // overload for 'question'
  }): Promise<any>;
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
          t2.id student_id
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
        // 增添查询小组结论的功能
        const sql = `
        SELECT
          t1.id node_id,
          t2.group_name,
          t2.group_color,
          t2.id group_id,
          t3.content
        FROM
          node_table t1
          JOIN \`group\` t2 ON t2.id = t1.group_id
          LEFT JOIN argunode t3 ON t3.arguKey = t1.id 
          AND t3.type = 'claim' 
          AND t3.version = ( SELECT MAX( version ) FROM argunode sub WHERE sub.arguKey = t3.arguKey AND sub.type = t3.type ) 
        WHERE
          t1.type = 'group' 
          AND t1.topic_id = ${topic_id};
          `;
        return await this.s.query<GroupType>(sql);
      }
      case 'question': {
        const sql = `
         SELECT
          t1.id node_id,
          t1.content,
          t2.nickname,
          t3.group_color,
          t2.id student_id
        FROM
          node_table t1
          LEFT JOIN student t2 ON t1.student_id = t2.id
          JOIN \`group\` t3 ON t3.id = t2.group_id 
        WHERE
          t1.type = '${type}' 
          AND t1.topic_id = ${topic_id};`;

        return await this.s.query<QuestionType>(sql);
      }
    }
  }

  public async findGroupByTopicIdStudentId(
    topic_id: number,
    student_id: number,
  ) {
    // 依据student_id和topic_id查询小组节点的id
    const sql = `
    SELECT
      t1.id,
      t1.type,
      t1.class_id,
      t1.group_id,
      t1.student_id,
      t1.topic_id,
      t1.created_time,
      t1.version
    FROM
      node_table t1
      JOIN \`group\` t2 ON t1.group_id = t2.id
      JOIN student t3 ON t3.group_id = t2.id
    WHERE
      t3.id = ${student_id} and t1.type = 'group' and t1.topic_id = ${topic_id};
        `;

    return (await this.s.query<NodeTable>(sql))[0];
  }
}
