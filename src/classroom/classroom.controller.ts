import { Controller, Get } from '@nestjs/common';
import { ClassroomService } from './classroom.service';

@Controller('classroom')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}
  @Get('queryClassroomList')
  findAll() {
    return this.classroomService.findAll();
  }
}
