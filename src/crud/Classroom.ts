import { SqlService } from 'src/db';
// import { GroupTable } from './Table.model';
import { CRUDer } from './index';

export default class ClassroomCruder implements CRUDer {
  s: SqlService;
  constructor(serviceInstance: SqlService) {
    this.s = serviceInstance;
  }

  public async queryAllClassroom() {
    const sql = `
    SELECT
      t1.id,
      t1.class_name 
    FROM
      class t1 
    WHERE
      t1.\`status\` = 1;
      `;
    return await this.s.query<{ id: number; class_name: string }>(sql);
  }
}
