import { SqlService } from 'src/db';
import { CRUDer } from './index';
import { EdgeTable } from './Table.model';

export default class EdgeCRUDer implements CRUDer {
  s: SqlService;
  constructor(sqlService: SqlService) {
    this.s = sqlService;
  }

  /**
   *
   * @returns insertId
   */
  public async createOne({
    source,
    target,
    type,
    topic_id,
  }: Pick<EdgeTable, 'source' | 'target' | 'type' | 'topic_id'>) {
    return await this.s.insert(
      this.s.generateInsertSql(
        'edge_table',
        ['source', 'target', 'type', 'topic_id'],
        [[source, target, type, topic_id]],
      ),
    );
  }

  public async selectAllByTopicId(topic_id: number) {
    return await this.s.query<
      Pick<EdgeTable, 'id' | 'source' | 'target' | 'type'>
    >(
      this.s.generateSelectSql<EdgeTable>(
        'edge_table',
        ['id', 'source', 'target', 'type'],
        {
          field: 'topic_id',
          value: topic_id,
          charset: '=',
        },
      ),
    );
  }
}
