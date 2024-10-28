import { Injectable, HttpException } from '@nestjs/common';
import { UploadInput, UploadFileInfo } from './interface';
import { SqlService } from 'src/db';
import { Student_File_Storage } from 'src/crud/Table.model';
function validateUploadInput(input: UploadInput): boolean {
  // 检查 student_id 是否为数字
  if (typeof input.student_id !== 'number') {
    console.log('student_id错误');
    return false;
  }

  // 检查 is_public 是否为 0 或 1
  if (input.is_public !== 0 && input.is_public !== 1) {
    console.log('is_public错误');

    return false;
  }

  // 检查 topic 是否为数字
  if (typeof input.topic_id !== 'number') {
    console.log('topic错误');
    return false;
  }

  // 如果所有检查都通过，则返回 true
  return true;
}
@Injectable()
export class UploadService extends SqlService {
  /**
   *
   * @param uploadInput
   * @param uploadFileInfo
   * @description 单文件上传
   * @returns
   */
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
              uploadInput.topic_id,
            ],
          ],
        ),
      );
    });

    return {
      data: {},
      message: 'Upload Success',
    };
  }

  async uploadMuple(
    uploadInput: UploadInput,
    uploadFileInfoList: UploadFileInfo[],
  ) {
    if (!validateUploadInput(uploadInput)) {
      throw new HttpException('参数错误', 400);
    }
    // 存到数据库表中
    await this.transaction(async () => {
      const sql = this.generateInsertSql<Student_File_Storage>(
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
        uploadFileInfoList.map((uploadFileInfo) => {
          return [
            uploadFileInfo.fileName,
            uploadFileInfo.filePath,
            uploadInput.student_id,
            'NOW',
            uploadInput.is_public,
            0,
            0,
            uploadInput.topic_id,
          ];
        }),
      );
      await this.insert(sql);
    });
    return {
      data: {},
      message: 'Upload Files Success',
    };
  }
}
