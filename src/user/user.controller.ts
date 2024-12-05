import { Controller, Post, Body, Query, Get, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { Login, QueryCollaboration } from './models/';
import { Create } from './models/';

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

  @Patch('update')
  updatePassword(
    @Body() updatePasswordParam: { username: string; newPassword: string },
  ) {
    return this.userService.changePassword(updatePasswordParam);
  }

  @Get('collInfo')
  findCollaborationInfo(@Query() query: QueryCollaboration) {
    query = {
      group_id: +query.group_id,
      id: +query.id,
    };
    return this.userService.queryUserCollInfo(query);
  }
}
