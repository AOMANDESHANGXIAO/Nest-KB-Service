import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Response {
  data: any;
  message?: string;
}

@Injectable()
export class ResponseInterceptor<T extends Response>
  implements NestInterceptor<T, any>
{
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    return next.handle().pipe(
      map((response) => ({
        code: 200,
        success: true,
        message: response?.message || '请求成功',
        data: response.data,
      })),
    );
  }
}
