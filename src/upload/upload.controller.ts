import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadInput } from './interface';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('addFile')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadInput: UploadInput,
  ) {
    return this.uploadService.upload(uploadInput, {
      fileName: file.originalname, // 原始文件名, 用于展示给用户看
      filePath: file.filename, // 当前文件名
    });
  }
}
