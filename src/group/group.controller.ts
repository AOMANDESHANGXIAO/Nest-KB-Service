import { Controller, Post, Body, Query, Get } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateDto, JoinDto } from './Models/index';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post('create')
  create(@Body() createInput: CreateDto) {
    return this.groupService.create(createInput);
  }

  @Post('join')
  join(@Body() joinInput: JoinDto) {
    return this.groupService.join(joinInput);
  }

  @Get('query_collaboration_data')
  queryCollaborationData(@Query() queryInput: { group_id: number }) {
    return this.groupService.queryGroupCollData(queryInput.group_id);
  }
}
