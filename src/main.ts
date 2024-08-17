import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { AllExceptionsFilter } from './interceptors/filter.interceptor';
import { TokenMiddleware } from './token/token.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('service is running on port 3000: http://localhost:3000');

  // 全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // 全局中间件, 处理token
  app.use(new TokenMiddleware().use);

  await app.listen(3000);
}
bootstrap();
