import { Controller, Get, Param, Res } from '@nestjs/common';
import { ExcelService } from './excel.service';
import type { Response } from 'express';
@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Get('/interaction/:id')
  async exportExcel(@Param('id') id: number, @Res() res: Response) {
    const buffer = await this.excelService.getAllIdeaExcel(id);
    // console.log('get buffer', buffer);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="output_buffer.xlsx"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }
}
