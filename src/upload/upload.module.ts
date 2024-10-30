import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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
      const uuid = uuidv4();
      const fileName = `${uuid + extname(file.originalname)}`;
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
