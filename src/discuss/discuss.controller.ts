import { Controller, Get, Query } from '@nestjs/common';
import { DiscussService } from './discuss.service';

@Controller('discuss')
export class DiscussController {
  constructor(private readonly discussService: DiscussService) {}

  @Get('queryTopic')
  findAll(
    @Query() queryInput: { class_id: number; content?: string; sort?: 1 | 0 },
  ) {
    return this.discussService.findAll(queryInput);
  }

  /**
   *
   * @param topic_id 课程id
   * @description 查询话题的内容
   */
  @Get('topic_content')
  public async queryTopicContent(@Query('id') id: number) {
    return this.discussService.findOne(id);
  }
}
