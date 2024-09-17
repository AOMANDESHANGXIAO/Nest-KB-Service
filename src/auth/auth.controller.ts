import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginParam: Login) {
    return this.authService.login(loginParam);
  }

  @Post('register')
  register(@Body() registerParam: Register) {
    return this.authService.register(registerParam);
  }
}

export interface Login {
  username: string;
  password: string;
}

export interface Register {
  username: string;
  password: string;
  nickname: string;
}
