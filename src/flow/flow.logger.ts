import { SqlService } from 'src/db';

/**
 * 这个方法用来记录学生修改Node的行为
 */
export async function logNodeRevise(
  service: SqlService,
  args: {
    node_id: number;
    student_id: number;
    content: string;
    version: number;
  },
) {
  await service.transaction(async () => {
    const { node_id, student_id, content, version } = args;
    const sql = `INSERT INTO node_table_revise_logger (node_id, student_id, content, version, created_time) VALUES (${node_id}, ${student_id}, '${content}', ${version}, NOW())`;
    await service.insert(sql);
  });
  return true;
}
