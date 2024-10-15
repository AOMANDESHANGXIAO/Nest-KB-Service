import { HttpException, Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
import { UploaderInput } from './interface';
import { Student_File_Storage, StudentTable } from 'src/crud/Table.model';
import { getFilePath } from 'src/utils/filePathHandler';
interface CreateFileInput extends UploaderInput {
  filename: string;
}

@Injectable()
export class UploadService extends SqlService {
  async create(createFileInput: CreateFileInput) {
    const { student_id, filename, is_public, topic_id } = createFileInput;
    // FIXME: 请求参数读取格式问题
    console.log('>>>Uploader', createFileInput);
    console.log('typeof is_public', typeof is_public);
    if (student_id === undefined) {
      throw new HttpException('未提供student_id', 400);
    } else {
      // 查询student_id是否存在
      const res = await this.query<StudentTable>(
        `SELECT * FROM student WHERE id = ${student_id}`,
      );
      if (!res || res.length === 0) {
        throw new HttpException('student_id不存在', 400);
      }
    }

    if (
      filename === undefined ||
      filename === '' ||
      topic_id === undefined ||
      is_public === undefined ||
      (is_public !== '0' && is_public !== '1')
    ) {
      throw new HttpException('入参不合法', 400);
    }

    const filePath = getFilePath(filename);
    // 数据库表插入记录
    await this.transaction(async () => {
      await this.insert(
        this.generateInsertSql<Student_File_Storage>(
          'student_file_storage',
          [
            'filename',
            'file_path',
            'uploader_id',
            'upload_time',
            'is_public',
            'is_removed',
            'download_count',
            'topic_id',
          ],
          [
            [
              filename,
              filePath,
              student_id,
              'NOW',
              Number(is_public),
              0,
              0,
              topic_id,
            ],
          ],
        ),
      );
    });

    return {
      data: {},
      message: '上传成功',
    };
  }
}
