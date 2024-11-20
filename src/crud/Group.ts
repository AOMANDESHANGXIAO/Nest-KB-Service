import { SqlService } from 'src/db';
import { GroupTable } from './Table.model';
import { CRUDer } from './index';

// 提供Group表的增删改查方法
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

  queryShareFeedbackSummaryNumByGroupId: (
    id: number,
  ) => Promise<{ share: number; feedback: number; summary: number }>;

  queryShareFeedbackNumByGroupId: (
    id: number,
  ) => Promise<{ share: number; feedback: number }[]>;

  querySummaryNumByGroupId: (id: number) => Promise<{ summary: number }[]>;

  selectEachMemberProposeFeedbackByGroupId: (
    id: number,
  ) => Promise<{ name: string; proposeNum: string; feedbackNum: string }[]>;

  selectEachMemberSummaryByGroupId: (
    id: number,
  ) => Promise<{ name: string; summaryNum: string }[]>;

  selectEachMemberProposeFeedbackSummaryByGroupId: (id: number) => Promise<{
    feedbacks: { name: string; value: number }[];
    proposes: { name: string; value: number }[];
    summarys: { name: string; value: number }[];
  }>;

  selectEachOneProposeFeedbackSummaryByGroupId: (id: number) => Promise<
    {
      summaryNum: number;
      proposeNum: number;
      feedbackNum: number;
      id: number;
      name: string;
    }[]
  >;
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

  public async selectAllNameByGroupId(id: number) {
    const sql = `
    SELECT
      t1.id,
      t1.nickname name 
    FROM
      student t1 
    WHERE
      t1.group_id = ${id};`;
    return this.s.query<{ id: number; name: string }>(sql);
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
      node_table_revise_logger t1
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
      node_table_revise_logger t1
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

  public async selectEachOneShareFeedbackByGroupId(id: number) {
    const sql = `
    SELECT
      t1.student_id as id,
      t3.nickname as name,
      SUM( CASE WHEN t2.type = 'idea_to_group' THEN 1 ELSE 0 END ) AS proposeNum,
      sum( CASE WHEN t2.type = 'reject' OR t2.type = 'approve' THEN 1 ELSE 0 END ) AS feedbackNum 
    FROM
      node_table t1
      JOIN edge_table t2 ON t2.source = t1.id
      JOIN student t3 ON t3.id = t1.student_id
      AND t3.group_id = ${id} 
    GROUP BY
      t1.student_id;`;

    return this.s.query<{
      id: number; // 学生id
      name: string;
      proposeNum: number;
      feedbackNum: number;
    }>(sql);
  }

  public async selectEachOneSummaryByGroupId(id: number) {
    const sql = `
    SELECT
      t1.student_id as id,
      count( * ) AS summaryNum 
    FROM
      node_table_revise_logger t1
      JOIN node_table t2 ON t2.type = 'group'
      JOIN student t3 ON t3.id = t1.student_id 
      AND t3.group_id = ${id} 
      AND t2.id = t1.node_id 
    GROUP BY
      t1.student_id
    `;

    return this.s.query<{ id: number; summaryNum: number }>(sql);
  }

  public async selectEachOneProposeFeedbackSummaryByGroupId(id: number) {
    const [eachOneProposeFeedback, eachOneSummary, eachOnes] =
      await Promise.all([
        this.selectEachOneShareFeedbackByGroupId(id),
        this.selectEachOneSummaryByGroupId(id),
        this.selectAllNameByGroupId(id),
      ]);
    // 拼接数据, 将eachOneSummary的数据拼接到eachOneProposeFeedback
    const eachOneProposeFeedbackSummary = eachOneProposeFeedback.map((item) => {
      const summary = eachOneSummary.find((i) => i.id === item.id);
      return {
        proposeNum: Number(item.proposeNum) || 0,
        feedbackNum: Number(item.feedbackNum) || 0,
        id: item.id,
        name: item.name,
        summaryNum: summary?.summaryNum || 0,
      };
    });
    eachOnes.forEach((item) => {
      const index = eachOneProposeFeedbackSummary.findIndex(
        (i) => i.id === item.id,
      );
      if (index === -1) {
        eachOneProposeFeedbackSummary.push({
          id: item.id,
          name: item.name,
          proposeNum: 0,
          feedbackNum: 0,
          summaryNum: 0,
        });
      }
    });

    return eachOneProposeFeedbackSummary;
  }
}
