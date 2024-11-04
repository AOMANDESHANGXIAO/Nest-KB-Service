import { Module } from '@nestjs/common';
import { CourseworkService } from './coursework.service';
import { CourseworkController } from './coursework.controller';

@Module({
  controllers: [CourseworkController],
  providers: [CourseworkService],
})
export class CourseworkModule {}
