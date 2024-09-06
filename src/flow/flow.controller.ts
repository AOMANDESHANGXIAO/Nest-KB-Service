/**
 * 核心业务：控制流程图Service
 */
import { Controller, Get, Post, Query, Body, Patch } from '@nestjs/common';
import { FlowService } from './flow.service';
import { CreateNewIdeaArgs } from './Models/index';

/**
 * TODO: 实现发布小组观点功能API
 * 这个类用于控制 流程图 包括小组的论证图等路由
 */
@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}
  @Get('query')
  public async queryFlow(@Query('topic_id') topic_id: number) {
    return await this.flowService.queryFlow(topic_id);
  }

  @Get('query_content')
  public async queryContent(@Query('node_id') node_id: number) {
    return await this.flowService.queryNodeContentById(+node_id);
  }

  @Get('query_group_content')
  public async queryGroupContent(@Query('node_id') node_id: string) {
    return await this.flowService.queryGroupNodeContentByNodeId(node_id);
  }

  @Post('propose_idea')
  public async proposeIdea(@Body() args: CreateNewIdeaArgs) {
    return await this.flowService.createNewIdea(args, 'idea');
  }

  @Post('reply_idea')
  public async replyIdea(@Body() args: CreateNewIdeaArgs) {
    return await this.flowService.createNewIdea(args, 'reply');
  }

  @Patch('modify_idea')
  public async modifyIdea(@Body() args: CreateNewIdeaArgs) {
    return await this.flowService.createNewIdea(args, 'modify');
  }
}
