import { SqlService } from 'src/db';
import { StudentTable } from './Table.model';
import { CRUDer } from './index';

export interface StudentCRUD extends CRUDer {
  selectOneById: (id: number) => Promise<StudentTable>;
}

class StudentCRUDer implements StudentCRUD {
  s: SqlService;
  constructor(serviceInstance: SqlService) {
    this.s = serviceInstance;
  }

  public async selectOneById(id: number): Promise<StudentTable> {
    const sql = `SELECT * FROM student WHERE id = ${id}`;
    const [res] = await this.s.query(sql);
    return res as StudentTable;
  }

  public async findOneExist(key: number | string): Promise<boolean> {
    if (typeof key === 'number') {
      return false;
    } else if (typeof key === 'string') {
      const res = await this.findOneByUsername(key);
      return res.length > 0;
    }
    return false;
  }

  public async findOneByUsername(username: string): Promise<StudentTable[]> {
    const sql = `SELECT * FROM student WHERE username = '${username}'`;

    const res = await this.s.query<StudentTable>(sql);

    return res;
  }

  public async findUserGroupById(id: number) {
    const sql = `
    SELECT 
    id, 
    group_color,
    group_name,
    group_code
    FROM \`group\` t1 WHERE t1.id = ${id}
  `;

    const result = await this.s.query<{
      id: number;
      group_color: string;
      group_name: string;
      group_code: string;
    }>(sql);

    return result;
  }

  public async findMembersIdeaNumbersById(group_id: number) {
    const sql = `
    SELECT
      t1.student_id AS id,
      t3.nickname AS NAME,
      sum( CASE WHEN t2.type = 'idea_to_group' THEN 1 ELSE 0 END ) AS proposeNum,
      sum( CASE WHEN t2.type = 'reject' THEN 1 ELSE 0 END ) AS rejectNum,
      sum( CASE WHEN t2.type = 'approve' THEN 1 ELSE 0 END ) AS approveNum 
    FROM
      node_table t1
      JOIN edge_table t2 ON t2.source = t1.id
      JOIN student t3 ON t3.id = t1.student_id 
      AND t3.group_id = ${group_id} 
    GROUP BY
      t1.student_id;`;

    const res = await this.s.query<{
      id: number;
      NAME: string;
      proposeNum: number;
      rejectNum: number;
      approveNum: number;
    }>(sql);

    return res;
  }

  public async findMembersSummaryAndReviseById(group_id: number) {
    const sql = `
    SELECT
      t1.student_id AS id,
      t3.nickname as stuName,
      SUM( CASE WHEN t2.type = 'group' THEN 1 ELSE 0 END ) AS summaryNum,
      Sum( CASE WHEN t2.type = 'idea' THEN 1 ELSE 0 END ) AS reviseNum 
    FROM
      node_table_revise_logger t1
      JOIN node_table t2 ON t2.type = 'group' 
      OR t2.type = 'idea'
      JOIN student t3 ON t3.id = t1.student_id 
      AND t3.group_id = ${group_id} 
      AND t2.id = t1.node_id 
    GROUP BY
      t1.student_id
    `;

    const res = await this.s.query<{
      id: number;
      stuName: string;
      summaryNum: number;
      reviseNum: number;
    }>(sql);

    return res;
  }

  public async findAllByGroupId(group_id: number) {
    const sql = `
    SELECT
      t1.id,
      t1.nickname stuName 
    FROM
      student t1 
    WHERE
      t1.group_id = ${group_id}`;

    const res = await this.s.query<{
      id: number;
      stuName: string;
    }>(sql);

    return res;
  }

  public async findInteractionByGroupId(group_id: number) {
    const sql = `
  SELECT 
      t1.source, 
      t1.target, 
      t3.nickname AS 'activer',
      t5.nickname AS 'inActiver'
  FROM 
      edge_table t1
  JOIN 
      node_table t2 ON t1.source = t2.id
  JOIN 
      student t3 ON t3.id = t2.student_id
  JOIN 
      node_table t4 ON t1.target = t4.id
  JOIN 
      student t5 ON t5.id = t4.student_id
  WHERE
      t3.group_id = ${group_id} and t1.type != 'group_to_discuss';`;

    const res = await this.s.query<{
      source: number;
      target: number;
      activer: string;
      inActiver: string;
    }>(sql);

    return res;
  }
}

export default StudentCRUDer;
