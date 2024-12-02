/**
 * 核心业务：控制流程图Service
 */
import { Controller, Get, Post, Query, Body, Patch } from '@nestjs/common';
import { FlowService } from './flow.service';
import {
  CreateNewIdeaArgs,
  CreateNewGroupIdeaArgs,
  CreateQuestionIdeaArgs,
} from './Models/index';

@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}
  @Get('query')
  public async queryFlow(@Query('topic_id') topic_id: number) {
    return await this.flowService.queryFlow(topic_id);
  }

  @Get('query_content')
  public async queryContent(
    @Query('node_id') node_id: number,
    @Query('student_id') student_id: number,
  ) {
    return await this.flowService.queryNodeContentById(
      +node_id,
      +student_id,
      'idea',
    );
  }

  @Get('query_group_content')
  public async queryGroupContent(
    @Query('node_id') node_id: string,
    @Query('student_id') student_id: number,
  ) {
    return await this.flowService.queryGroupNodeContentByNodeId(
      node_id,
      student_id,
    );
  }

  @Post('propose_idea')
  public async proposeIdea(@Body() args: CreateNewIdeaArgs) {
    return await this.flowService.createNewIdea(args, 'idea');
  }

  @Post('reply_idea')
  public async replyIdea(@Body() args: CreateNewIdeaArgs) {
    return await this.flowService.createNewIdea(args, 'reply');
  }

  @Post('question_idea')
  public async questionIdea(@Body() args: CreateQuestionIdeaArgs) {
    return await this.flowService.createQuestionIdea(args);
  }

  @Get('check_question_content')
  public async checkQuestionContent(
    @Query('student_id') student_id: number,
    @Query('node_id') node_id: number,
  ) {
    return await this.flowService.queryQuestionNodeContentById({
      student_id,
      node_id,
    });
  }

  @Patch('modify_idea')
  public async modifyIdea(@Body() args: CreateNewIdeaArgs) {
    return await this.flowService.createNewIdea(args, 'modify');
  }

  @Post('propose_group_idea')
  public async proposeGroupIdea(@Body() args: CreateNewGroupIdeaArgs) {
    return await this.flowService.createGroupConclusion(args);
  }

  @Patch('modify_group_idea')
  public async modifyGroupIdea(@Body() args: CreateNewGroupIdeaArgs) {
    return await this.flowService.modifyGroupConslusion(args);
  }

  /**
   * 学习分析仪表盘接口
   */
  @Get('dashboard')
  public async queryDashboard(
    @Query('topic_id') topic_id: number,
    @Query('student_id') student_id: number,
    @Query('group_id') group_id: number,
  ) {
    return await this.flowService.queryDashboard(
      topic_id,
      student_id,
      group_id,
    );
  }

  @Get('wordCloud')
  public async queryWordCloud(@Query('topic_id') topic_id: number) {
    return await this.flowService.queryWordCloud(topic_id);
  }

  @Get('group_opinion_list')
  public async queryGroupOpinionList(
    @Query()
    args: {
      topic_id: number;
      group_id: number;
      page: number;
      page_size: number;
    },
  ) {
    return await this.flowService.queryGroupOpinionList(args);
  }
}
