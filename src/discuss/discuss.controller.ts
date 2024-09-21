import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { DiscussService } from './discuss.service';
import { QueryParams } from 'src/crud';
type CreateDiscussion = {
  topic_content: string;
  created_user_id: number;
  topic_for_class_id: number;
};
export type { CreateDiscussion };

@Controller('discuss')
export class DiscussController {
  constructor(private readonly discussService: DiscussService) {}

  @Get('queryTopic')
  findAllByClassId(
    @Query() queryInput: { class_id: number; content?: string; sort?: 1 | 0 },
  ) {
    return this.discussService.findAllByClassId(queryInput);
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

  @Post('create')
  public async create(
    @Body()
    params: CreateDiscussion,
  ) {
    return this.discussService.create(params);
  }

  @Get('all')
  public async findAll(@Query() params: QueryParams) {
    return this.discussService.findAll(params);
  }
}
