import { SqlService } from 'src/db';
import { GroupTable } from './Table.model';
import { CRUDer } from './index';

interface GroupCRUD extends CRUDer {
  selectGroupByOneField: (
    field: string,
    value: string | number,
  ) => Promise<GroupTable>;
  selectGroupByGroupId: (id: number) => Promise<GroupTable>;
  selectGroupByStudentId: (id: number) => Promise<GroupTable>;
  selectGroupByGroupname: (
    name: string,
    classId: number,
  ) => Promise<GroupTable>;
}

export default class GroupCRUDer implements GroupCRUD {
  s: SqlService;
  constructor(serviceInstance: SqlService) {
    this.s = serviceInstance;
  }

  public async selectGroupByOneField(
    field: string,
    value: string | number,
  ): Promise<GroupTable> {
    const sql = `SELECT * FROM \`group\` WHERE ${field} = ${this.s.handleValue(value)}`;

    const [res] = await this.s.query<GroupTable>(sql);

    return res;
  }

  public async selectGroupByGroupId(id: number): Promise<GroupTable> {
    const sql = `SELECT * FROM \`group\` WHERE id = ${id}`;
    const [res] = await this.s.query<GroupTable>(sql);
    return res;
  }

  public async selectGroupByStudentId(id: number): Promise<GroupTable> {
    const sql = `
    SELECT
      t1.belong_class_id,
      t1.group_code,
      t1.group_color,
      t1.group_description,
      t1.group_name,
      t1.id 
    FROM
      \`group\` t1
      JOIN student t2 ON t1.id = t2.group_id 
    WHERE
      t2.id = ${id}`;

    const [res] = await this.s.query<GroupTable>(sql);

    return res;
  }

  public async selectGroupByGroupname(
    name: string,
    classId: number,
  ): Promise<GroupTable> {
    const sql = `SELECT * FROM \`group\` WHERE group_name = '${name}' and belong_class_id = ${classId}`;

    const [res] = await this.s.query<GroupTable>(sql);

    return res;
  }
}
