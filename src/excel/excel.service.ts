import { Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
import * as ExcelJS from 'exceljs'; // 引入 exceljs

@Injectable()
export class ExcelService extends SqlService {
  constructor() {
    super();
  }
  /**
   * 获取所有idea的excel
   */
  async getAllIdeaExcel() {}

  /**
   * 导出 Excel 表格
   */
  async exportExcel(data: any[]) {
    // 接收数据参数
    const workbook = new ExcelJS.Workbook(); // 创建工作簿
    const worksheet = workbook.addWorksheet('Sheet1'); // 添加工作表

    // 设置表头
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
    ];

    // 添加数据行
    data.forEach((item) => {
      worksheet.addRow(item);
    });
    console.log('正在导出文件...');

    // 设置响应头，导出 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer();
    // const buffer = await workbook.xlsx.writeBuffer();
    // // 例如，直接将 buffer 响应给客户端
    // res.setHeader(
    //   'Content-Disposition',
    //   'attachment; filename="output_buffer.xlsx"',
    // );
    // res.setHeader(
    //   'Content-Type',
    //   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // );
    // res.send(buffer);

    return buffer; // 返回 Excel 文件的缓冲区
  }
}
