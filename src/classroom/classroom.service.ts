import { Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
import ClassroomCruder from 'src/crud/Classroom';

@Injectable()
export class ClassroomService extends SqlService {
  classroomCruder: ClassroomCruder;
  constructor() {
    super();
    this.classroomCruder = new ClassroomCruder(this);
  }
  public async findAll() {
    return {
      data: {
        list: await this.classroomCruder.queryAllClassroom(),
      },
    };
  }
}
