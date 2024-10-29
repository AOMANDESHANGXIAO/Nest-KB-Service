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
  success?: boolean;
}

@Injectable()
export class ResponseInterceptor<T extends Response>
  implements NestInterceptor<T, any>
{
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        let isSuccess = true;
        if (response !== undefined) {
          isSuccess = 'success' in response ? response.success : true;
        }
        return {
          code: 200,
          success: isSuccess,
          message: response?.message || '请求成功',
          data: response?.data || {},
        };
      }),
    );
  }
}
