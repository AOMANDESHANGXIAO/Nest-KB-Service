/*
 * @Author: tom 13849343+tomFfff@user.noreply.gitee.com
 * @Date: 2024-11-03 15:26:50
 * @LastEditors: tom 13849343+tomFfff@user.noreply.gitee.com
 * @LastEditTime: 2024-11-11 10:40:58
 * @FilePath: \knowledge-building-web\src\coursework\coursework.controller.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Controller, Body, Query } from '@nestjs/common';
import { CourseworkService } from './coursework.service';
import { Post, Get } from '@nestjs/common';
import {
  AddCourseWorkInput,
  GetCourseWorkInput,
  GetCourseWorkInputUploaded,
} from './interface';
/**
 * 控制发布课堂作业的接口
 */
@Controller('coursework')
export class CourseworkController {
  constructor(private readonly courseworkService: CourseworkService) {}
  @Post('add')
  addCoursework(@Body() addCourseWorkInput: AddCourseWorkInput) {
    return this.courseworkService.create(addCourseWorkInput);
  }

  @Get('content')
  getCourseworkContent(@Query() query: GetCourseWorkInput) {
    return this.courseworkService.findOne(query.topic_id);
  }

  @Get('uploaded')
  getUploadedCoursework(@Query() query: GetCourseWorkInputUploaded) {
    return this.courseworkService.findUploadedCoursework(query);
  }
}
