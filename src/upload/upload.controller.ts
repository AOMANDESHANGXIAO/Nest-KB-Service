import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
// multer中间件
import * as multer from 'multer';
import * as fs from 'fs';
import { join } from 'path';
import { UploaderInput } from './interface';
import config from 'src/config';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderPath = join(__dirname, `../${config.fileOption.staticFolder}`);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // 上传文件
  @Post('addFile')
  @UseInterceptors(FileInterceptor('file', { storage }))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploaderInput: UploaderInput,
  ) {
    return this.uploadService.create({
      filename: file.filename,
      ...uploaderInput,
    });
  }
}
