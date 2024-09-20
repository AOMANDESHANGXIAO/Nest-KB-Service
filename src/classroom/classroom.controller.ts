import { Controller, Get, Post, Body, Delete, Query } from '@nestjs/common';
import { ClassroomService } from './classroom.service';

@Controller('classroom')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}
  @Get('queryClassroomList')
  findAll() {
    return this.classroomService.findAll();
  }

  @Post('create')
  createClass(@Body() params: { className: string }) {
    const { className } = params;
    return this.classroomService.create(className);
  }

  @Delete('delete')
  deleteClass(@Body() params: { id: number }) {
    const { id } = params;
    return this.classroomService.delete(id);
  }

  /* 查询班级所有学生 */
  @Get('user')
  findOneUser(
    @Query() params: { id: number; page?: number; pageSize?: number },
  ) {
    return this.classroomService.findOneUser(params);
  }
}
