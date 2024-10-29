import { Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
import { FileQueryParams } from './interface';
@Injectable()
export class FilesService extends SqlService {
  async findGroupFile(params: FileQueryParams) {
    const sql = `
    SELECT
      s.filename,
      s.file_path,
      s.upload_time,
      student.nickname 
    FROM
      \`student_file_storage\` s
      JOIN student ON student.group_id = ${params.group_id} 
      AND student.id = s.uploader_id 
    WHERE
      s.topic_id = ${params.topic_id} 
      AND s.is_removed != 1
      ORDER BY s.upload_time ${params.sort ? params.sort : 'ASC'}
    LIMIT ${params.pageSize} OFFSET ${(params.page - 1) * params.pageSize};`;
    const res = await this.query<{
      filename: string;
      file_path: string;
      upload_time: string;
      nickname: string;
    }>(sql);
    const [totalNum] = await this.query<{ cnt: number }>(
      `SELECT
        count(*) cnt
      FROM
        \`student_file_storage\` s
        JOIN student ON student.group_id = ${params.group_id} 
        AND student.id = s.uploader_id 
      WHERE
        s.topic_id = ${params.topic_id} 
        AND s.is_removed != 1`,
    );
    return {
      data: {
        list: res,
        totalNum: totalNum.cnt,
      },
    };
  }

  async findCommunityFile(params: FileQueryParams) {
    const sql = `
    SELECT
      s.filename,
      s.file_path,
      s.upload_time,
      student.nickname 
    FROM
      \`student_file_storage\` s
      JOIN student ON student.id = s.uploader_id 
    WHERE
      s.topic_id = ${params.topic_id} 
      AND s.is_public = 1 
      AND s.is_removed != 1
      ORDER BY s.upload_time ${params.sort ? params.sort : 'ASC'}
    LIMIT ${params.pageSize} OFFSET ${(params.page - 1) * params.pageSize};`;

    const res = await this.query<{
      filename: string;
      file_path: string;
      upload_time: string;
      nickname: string;
    }>(sql);
    const [totalNum] = await this.query<{ cnt: number }>(
      `SELECT
        count(*) cnt
      FROM
        \`student_file_storage\` s 
      WHERE
        s.topic_id = ${params.topic_id} 
        AND s.is_public = 1 
        AND s.is_removed != 1`,
    );
    return {
      data: {
        list: res,
        totalNum: totalNum.cnt,
      },
    };
  }
}
