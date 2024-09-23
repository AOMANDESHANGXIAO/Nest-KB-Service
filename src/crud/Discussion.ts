import { SqlService } from 'src/db';
// import { GroupTable } from './Table.model';
import { CRUDer } from './index';
import { DiscussTable } from './Table.model';
export default class DiscussionCRUDer implements CRUDer {
  s: SqlService;
  constructor(serviceInstance: SqlService) {
    this.s = serviceInstance;
  }

  public async queryDiscussionByClassId(
    class_id: number,
    sort?: 1 | 0,
    like?: string,
  ) {
    let sql = `
    SELECT
      t1.id,
      t1.topic_content,
      t1.status,
      t1.created_time,
      t2.nickname 
    FROM
      discussion t1
      JOIN admin t2 ON t2.id = t1.created_user_id 
    WHERE
      t1.topic_for_class_id = ${class_id}`;

    like && (sql += ` AND t1.topic_content LIKE '%${like}%'`);

    sql += ` ORDER BY t1.created_time ${sort ? 'DESC' : 'ASC'};`;

    return await this.s.query<{
      id: number;
      topic_content: string;
      created_time: Date;
      nickname: string;
      status: DiscussTable['status'];
    }>(sql);
  }
}
