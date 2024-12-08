import { Module } from '@nestjs/common';
import { ViewpointService } from './viewpoint.service';
import { ViewpointController } from './viewpoint.controller';

@Module({
  controllers: [ViewpointController],
  providers: [ViewpointService],
})
export class ViewpointModule {}
