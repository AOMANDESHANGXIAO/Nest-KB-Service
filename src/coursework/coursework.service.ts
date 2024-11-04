import { Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
import { AddCourseWorkInput, GetCourseWorkInputUploaded } from './interface';
import { Course_Work_Upload_Storage } from 'src/crud/Table.model';
@Injectable()
export class CourseworkService extends SqlService {
  async create(addCourseWorkInput: AddCourseWorkInput) {
    const { topic_id, content } = addCourseWorkInput;
    // 查询topic_id是否存在
    const sqlDiscuss = `select * from discussion where id = ${topic_id}`;
    const sqlDiscussResult = await this.query(sqlDiscuss);

    if (sqlDiscussResult.length === 0) {
      throw new Error('topic_id not exists');
    }

    // 更新discussion的课堂作业
    await this.transaction(async () => {
      const sqlUpdate = `update discussion set courseWork = '${content}' where id = ${topic_id}`;
      await this.query(sqlUpdate);
    });

    return {
      data: {},
    };
  }

  async findOne(topic_id: number) {
    const sql = `select courseWork from discussion where id = ${topic_id}`;
    const sqlResult = await this.query<{ courseWork: string }>(sql);

    return {
      data: sqlResult[0],
    };
  }

  async findUploadedCoursework(queryInput: GetCourseWorkInputUploaded) {
    const { student_id, topic_id } = queryInput;
    const sql = `select * from course_work_upload_storage where student_id = ${student_id} and topic_id = ${topic_id}`;
    const [res] = await this.query<Course_Work_Upload_Storage>(sql);
    if (res) {
      return {
        data: res,
      };
    }

    return {
      data: null,
    };
  }
}
