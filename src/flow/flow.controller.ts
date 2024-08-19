/**
 * 核心业务：控制流程图Service
 */
import { Controller, Get, Query } from '@nestjs/common';
import { FlowService } from './flow.service';

@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}
  @Get('query')
  public async queryFlow(@Query('topic_id') topic_id: number) {
    return await this.flowService.queryFlow(topic_id);
  }
}
