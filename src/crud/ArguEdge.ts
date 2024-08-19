import { SqlService } from 'src/db';
import { ArguEdgeTable } from './Table.model';
import { CRUDer } from './index';

export default class ArguEdgeCruder implements CRUDer {
  s: SqlService;
  constructor(sqlService: SqlService) {
    this.s = sqlService;
  }

  public async createMany(
    columns: Array<keyof ArguEdgeTable>,
    values: Array<(string | number)[]>,
  ) {
    await this.s.insert(
      this.s.generateInsertSql<ArguEdgeTable>('arguedge', columns, values),
    );
  }
}
