/*
 * @Author: tom 13849343+tomFfff@user.noreply.gitee.com
 * @Date: 2024-08-16 13:02:10
 * @LastEditors: tom 13849343+tomFfff@user.noreply.gitee.com
 * @LastEditTime: 2024-11-12 11:47:10
 * @FilePath: \knowledge-building-web\src\main.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { AllExceptionsFilter } from './interceptors/filter.interceptor';
import { TokenMiddleware } from './token/token.middleware';
import config from './config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  console.log(`service is running on: http://localhost:${config.port}/`);

  // 全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // 全局中间件, 处理token
  app.use(new TokenMiddleware().use);
  app.enableCors();
  // 配置前缀, 此项为可选
  app.useStaticAssets(join(__dirname, `uploads`), {
    prefix: '/static',
  });
  await app.listen(config.port);
}
bootstrap();
