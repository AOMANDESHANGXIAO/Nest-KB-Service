/**
 * 核心业务：控制流程图Service
 */
import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { FlowService } from './flow.service';
import { CreateNewIdeaArgs } from './Models/index';

@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}
  @Get('query')
  public async queryFlow(@Query('topic_id') topic_id: number) {
    return await this.flowService.queryFlow(topic_id);
  }

  @Get('query_content')
  public async queryContent(@Query('node_id') node_id: number) {
    // console.log('node_id ===>', node_id);
    return await this.flowService.queryNodeContentById(+node_id);
  }

  @Post('propose_idea')
  public async proposeIdea(@Body() args: CreateNewIdeaArgs) {
    return await this.flowService.createNewIdea(args);
  }

  // TODO: 1. 实现回复观点、总结小组讨论内容、修改自身想法的apis
}
