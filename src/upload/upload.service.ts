import { Injectable, HttpException } from '@nestjs/common';
import { UploadInput, UploadFileInfo } from './interface';
import { SqlService } from 'src/db';
import { Student_File_Storage } from 'src/crud/Table.model';
function validateUploadInput(input: UploadInput): boolean {
  // 检查 student_id 是否为数字
  if (typeof input.student_id !== 'number') {
    return false;
  }

  // 检查 is_public 是否为 0 或 1
  if (input.is_public !== 0 && input.is_public !== 1) {
    return false;
  }

  // 检查 topic 是否为数字
  if (typeof input.topic !== 'number') {
    return false;
  }

  // 如果所有检查都通过，则返回 true
  return true;
}
@Injectable()
export class UploadService extends SqlService {
  async upload(uploadInput: UploadInput, uploadFileInfo: UploadFileInfo) {
    if (!validateUploadInput(uploadInput)) {
      throw new HttpException('参数错误', 400);
    }
    // 存到数据库表中
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
              uploadFileInfo.fileName,
              uploadFileInfo.filePath,
              uploadInput.student_id,
              'NOW',
              uploadInput.is_public,
              0,
              0,
              uploadInput.topic,
            ],
            ,
          ],
        ),
      );
    });

    return {
      data: {},
      message: 'Upload Success',
    };
  }
}
