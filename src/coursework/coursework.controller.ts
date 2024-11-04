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
