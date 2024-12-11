import { Controller, Get, Query } from '@nestjs/common';
import { DataAnalysisService } from './data-analysis.service';

@Controller('data-analysis')
export class DataAnalysisController {
  constructor(private readonly dataAnalysisService: DataAnalysisService) {}
  @Get('interact')
  async getInteractData(
    @Query('topic_id') topic_id: number,
    @Query('group_id') group_id: number,
  ) {
    return this.dataAnalysisService.getGroupInteraction({
      topic_id,
      group_id,
    });
  }
}
