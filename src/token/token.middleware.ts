import { HttpException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import JwtHandler from 'src/utils/jwt.handler';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  constructor() {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 获取请求的路由地址
    const route = req.path;
    const token = req.headers['authorization'];

    if (token) {
      const jwtHandler = new JwtHandler();
      try {
        await jwtHandler.validate(route, token); // 注意方法名是否为 validate
        next();
      } catch (err) {
        // 需要将中间件的异常包装成一个promise，在promise中抛出异常
        // 否则全局过滤器不会捕获这些异常
        next(new HttpException('Invalid token', 401));
      }
    } else {
      next(new HttpException('Invalid token', 401));
    }
  }
}
