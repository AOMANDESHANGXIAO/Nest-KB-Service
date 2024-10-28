import { HttpException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import JwtHandler from 'src/utils/jwt.handler';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  constructor() {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 获取请求的路由地址
    const method = req.method;
    if (method === 'OPTIONS') {
      next();
      return;
    }

    const route = req.path;
    const token = req.headers['authorization'];
    const jwtHandler = new JwtHandler();
    // console.log('method', method, 'route', route, 'token', token);
    try {
      // console.log('route is', route);
      if (route.startsWith('/static')) {
        // 静态资源，可以直接访问，不需要验证token
        next();
        return;
      }
      await jwtHandler.validate(route, token);
      next();
    } catch (err) {
      // 需要将中间件的异常包装成一个promise，在promise中抛出异常
      // 否则全局过滤器不会捕获这些异常
      next(new HttpException('Invalid token', 401));
    }
  }
}
