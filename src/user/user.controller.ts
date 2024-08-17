import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { Login } from '../models/User';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signin')
  login(@Body() loginParam: Login) {
    return this.userService.login(loginParam);
  }

  @Post('signup')
  create(@Body() createUserDto: any) {
    return this.userService.create(createUserDto);
  }
}
