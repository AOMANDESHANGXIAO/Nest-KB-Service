import { Controller, Post, Body, Query, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { Login, QueryCollaboration } from '../models/User';
import { Create } from '../models/User';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signin')
  login(@Body() loginParam: Login) {
    return this.userService.login(loginParam);
  }

  @Post('signup')
  create(@Body() createUserParam: Create) {
    return this.userService.create(createUserParam);
  }

  @Get('collInfo')
  findCollaborationInfo(@Query() query: QueryCollaboration) {
    return this.userService.queryUserCollaborationData(query);
  }
}
