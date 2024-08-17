import { Controller, Post, Body } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateDto } from './Models/index';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post('create')
  create(@Body() createDto: CreateDto) {
    return this.groupService.create(createDto);
  }
}
