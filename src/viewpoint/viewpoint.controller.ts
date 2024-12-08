import { Controller, Post, Body } from '@nestjs/common';
import { ViewpointService } from './viewpoint.service';
import { CreateIdeaArgs, CreateTopicArgs } from './viewpoint.interface';
/**
 * 控制器,控制观点的交互
 */
@Controller('viewpoint')
export class ViewpointController {
  constructor(private readonly viewpointService: ViewpointService) {}

  @Post('topic')
  createTopic(@Body() args: CreateTopicArgs) {
    return this.viewpointService.createTopic(args);
  }
  @Post('idea')
  createIdea(@Body() args: CreateIdeaArgs) {
    return this.viewpointService.createIdea(args);
  }
}
