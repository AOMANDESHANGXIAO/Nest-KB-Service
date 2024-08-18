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

  public async queryShareFeedbackSummaryNumByGroupId(id: number) {
    const [shareFeedbackNum, summaryNum] = await Promise.all([
      this.queryShareFeedbackNumByGroupId(id),
      this.querySummaryNumByGroupId(id),
    ]);

    return {
      share: +shareFeedbackNum[0].share,
      feedback: +shareFeedbackNum[0].feedback,
      summary: +summaryNum[0].summary,
    };
  }

  public async queryShareFeedbackNumByGroupId(id: number) {
    const sql = `
    SELECT
      SUM( CASE WHEN edge_table.type = 'idea_to_group' THEN 1 ELSE 0 END ) AS share,
      SUM( CASE WHEN edge_table.type IN ( 'reject', 'approve' ) THEN 1 ELSE 0 END ) AS feedback 
    FROM
      edge_table
      JOIN node_table ON node_table.id = edge_table.source
      JOIN student ON student.id = node_table.student_id
      JOIN \`group\` t1 ON t1.id = student.group_id 
    WHERE
      t1.id = ${id};`;

    return this.s.query<{ share: number; feedback: number }>(sql);
  }

  public async querySummaryNumByGroupId(id: number) {
    const sql = `
    SELECT
      count( t1.id ) summary 
    FROM
      node_revise_record_table t1
      JOIN student t2 ON t2.id = t1.student_id 
    WHERE
      t2.group_id = ${id};`;

    return this.s.query<{ summary: number }>(sql);
  }

  public async selectEachMemberProposeFeedbackByGroupId(id: number) {
    const sql = `
    SELECT 
        student.nickname AS name,
        SUM(CASE WHEN edge_table.type = 'idea_to_group' THEN 1 ELSE 0 END) AS proposeNum,
        SUM(CASE WHEN edge_table.type IN ('reject', 'approve') THEN 1 ELSE 0 END) AS feedbackNum
    FROM 
        edge_table
    JOIN 
        node_table ON node_table.id = edge_table.source
    JOIN 
        student ON student.id = node_table.student_id
    JOIN 
        \`group\` ON \`group\`.id = student.group_id
    WHERE 
        \`group\`.id = ${id}
    GROUP BY 
        student.id;
      `;

    return this.s.query<{
      name: string;
      proposeNum: string;
      feedbackNum: string;
    }>(sql);
  }

  public async selectEachMemberSummaryByGroupId(id: number) {
    const sql = `
    SELECT
      t2.nickname AS \`name\`, count( t1.id ) AS summaryNum 
    FROM
      node_revise_record_table t1
      JOIN student t2 ON t1.student_id = t2.id
      JOIN \`group\` t3 ON t3.id = t2.group_id 
    WHERE
      t3.id = ${id} 
    GROUP BY
      t2.id;
    `;

    return this.s.query<{ name: string; summaryNum: string }>(sql);
  }

  public async selectEachMemberProposeFeedbackSummaryByGroupId(id: number) {
    const [eachMemberProposeFeedback, eachMemberSummary] = await Promise.all([
      this.selectEachMemberProposeFeedbackByGroupId(id),
      this.selectEachMemberSummaryByGroupId(id),
    ]);
    // {value:XX, name:XX}
    const feedbacks = eachMemberProposeFeedback.map((item) => ({
      name: item.name,
      value: +item.proposeNum,
    }));
    const proposes = eachMemberProposeFeedback.map((item) => ({
      name: item.name,
      value: +item.feedbackNum,
    }));
    const summarys = eachMemberSummary.map((item) => ({
      name: item.name,
      value: +item.summaryNum,
    }));
    return {
      feedbacks,
      proposes,
      summarys,
    };
  }
}
