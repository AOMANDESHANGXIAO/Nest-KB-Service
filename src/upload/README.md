![alt text](image.png)


upload.controller.ts文件
``` TypeScript
import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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
    Object.keys(uploadInput).forEach((key) => {
      uploadInput[key] = Number(uploadInput[key]);
    });

    return this.uploadService.upload(uploadInput, {
      fileName: file.originalname, // 原始文件名, 用于展示给用户看
      filePath: file.filename, // 当前文件名
    });
  }
}

```

upload.module.ts文件
``` TypeScript
import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

const storage = MulterModule.register({
  storage: diskStorage({
    /**
     * 存放位置
     */
    destination: join(__dirname, '../uploads'),
    /**
     *
     * @param _ req
     * @param file
     * @param callback
     * @returns
     */
    filename: (req, file, callback) => {
      console.log('req', req.body);
      const fileName = `${new Date().getTime() + extname(file.originalname)}`;
      return callback(null, fileName);
    },
  }),
});

@Module({
  imports: [storage],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}

```