import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    console.log('发生了错误', exception.status);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    if (exception.status === 401) {
      response.status(200).json({
        code: 401,
        success: false,
        message: '用户未登录',
        data: null,
      });
      return;
    }
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      code: status,
      success: false,
      message: exception.message || '请求失败',
      data: null,
    });
  }
}
