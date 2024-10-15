import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { AllExceptionsFilter } from './interceptors/filter.interceptor';
import { TokenMiddleware } from './token/token.middleware';
import config from './config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
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
  app.useStaticAssets(join(__dirname, `./${config.fileOption.staticFolder}`), {
    prefix: config.fileOption.prefix,
  });
  await app.listen(config.port);
}
bootstrap();
