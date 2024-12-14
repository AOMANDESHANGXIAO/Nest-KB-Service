import { Controller, Get, Res } from '@nestjs/common';
import { ExcelService } from './excel.service';
import type { Response } from 'express';
@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Get('/export')
  async exportExcel(@Res() res: Response) {
    const buffer = await this.excelService.exportExcel([]);
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
