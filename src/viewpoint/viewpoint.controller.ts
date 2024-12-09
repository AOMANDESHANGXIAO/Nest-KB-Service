import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ViewpointService } from './viewpoint.service';
import {
  CreateAgreeArgs,
  CreateAskArgs,
  CreateDisAgreeArgs,
  CreateIdeaArgs,
  CreateResponseArgs,
  CreateTopicArgs,
} from './viewpoint.interface';
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
  @Post('agree')
  createAgree(@Body() args: CreateAgreeArgs) {
    return this.viewpointService.createAgree(args);
  }
  @Post('disagree')
  createDisagree(@Body() args: CreateDisAgreeArgs) {
    return this.viewpointService.createDisAgree(args);
  }
  @Post('ask')
  createAsk(@Body() args: CreateAskArgs) {
    return this.viewpointService.createAsk(args);
  }
  @Post('response')
  createResponse(@Body() args: CreateResponseArgs) {
    return this.viewpointService.createResponse(args);
  }
  @Get('topic')
  getTopicById(@Query('id') id: number) {
    return this.viewpointService.getTopic({
      topic_id: id,
    });
  }
  @Get('idea')
  getIdeaById(
    @Query('id') id: number,
    @Query('student_id') student_id: number,
  ) {
    return this.viewpointService.getIdea({
      id,
      student_id,
    });
  }
  @Get('agree')
  getAgreeById(
    @Query('id') id: number,
    @Query('student_id') student_id: number,
  ) {
    return this.viewpointService.getAgree({
      id,
      student_id,
    });
  }
  @Get('disagree')
  getDisagreeById(
    @Query('id') id: number,
    @Query('student_id') student_id: number,
  ) {
    return this.viewpointService.getDisAgree({
      id,
      student_id,
    });
  }
  @Get('ask')
  getAskById(@Query('id') id: number, @Query('student_id') student_id: number) {
    return this.viewpointService.getAsk({
      id,
      student_id,
    });
  }
}
