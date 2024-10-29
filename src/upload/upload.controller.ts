import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadInput } from './interface';

const MAX_UPLOAD_FILES = 5;

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('addFile')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadInput: UploadInput,
  ) {
    Object.keys(uploadInput).forEach((key) => {
      uploadInput[key] = Number(uploadInput[key]);
    });

    return this.uploadService.upload(uploadInput, {
      fileName: file.originalname, // 原始文件名, 用于展示给用户看
      filePath: file.filename, // 当前文件名
    });
  }

  /**
   *
   * @param files
   * @param uploadInput
   * @description 多文件上传
   * @returns
   */
  @Post('addFiles')
  @UseInterceptors(FilesInterceptor('files', MAX_UPLOAD_FILES))
  uploadMulple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadInput: UploadInput,
  ) {
    // 转换 uploadInput 中的值为数字
    Object.keys(uploadInput).forEach((key) => {
      uploadInput[key] = Number(uploadInput[key]);
    });

    return this.uploadService.uploadMuple(
      uploadInput,
      files.map((file) => {
        return {
          fileName: file.originalname, // 原始文件名, 用于展示给用户看
          filePath: file.filename, // 当前文件名
        };
      }),
    );
  }
}
