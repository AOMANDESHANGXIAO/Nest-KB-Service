import { Controller, Post, Body } from '@nestjs/common';
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
}
