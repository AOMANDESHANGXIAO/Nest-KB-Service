import { Controller, Get, Query, Res, Param } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileQueryParams } from './interface';
import { join } from 'path';
import type { Response } from 'express';
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('group')
  findGroupFile(@Query() params: FileQueryParams) {
    return this.filesService.findGroupFile(params);
  }

  @Get('community')
  findCommunityFile(@Query() params: FileQueryParams) {
    return this.filesService.findCommunityFile(params);
  }

  @Get('export/:filename')
  async downLoad(@Param('filename') filename: string, @Res() res: Response) {
    if (!filename) {
      return res.status(400).json({ message: '文件名是必须的' });
    }
    const url = join(__dirname, '../uploads/', filename);
    res.download(url, (err) => {
      if (!err) {
        console.log('success download', url);
        return;
      }
      console.error(err);
      res.send({
        code: 500,
        message: '下载失败',
      });
    });
  }
}
