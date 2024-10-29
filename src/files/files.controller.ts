import { Controller, Get, Query } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileQueryParams } from './interface';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('group')
  findGroupFile(@Query() params: FileQueryParams) {
    return this.filesService.findGroupFile(params);
  }
}
