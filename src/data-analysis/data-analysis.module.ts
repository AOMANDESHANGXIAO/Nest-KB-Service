import { Module } from '@nestjs/common';
import { DataAnalysisService } from './data-analysis.service';
import { DataAnalysisController } from './data-analysis.controller';

@Module({
  controllers: [DataAnalysisController],
  providers: [DataAnalysisService],
})
export class DataAnalysisModule {}
