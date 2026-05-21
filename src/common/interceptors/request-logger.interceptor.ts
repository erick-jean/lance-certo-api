import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logRequest({
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        });
      }),
      catchError((error: unknown) => {
        const statusCode =
          error instanceof HttpException ? error.getStatus() : 500;

        this.logRequest({
          method: request.method,
          path: request.originalUrl,
          statusCode,
          durationMs: Date.now() - startedAt,
        });

        return throwError(() => error);
      }),
    );
  }

  private logRequest(params: {
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
  }): void {
    const message = `${params.method} ${params.path} ${params.statusCode} ${params.durationMs}ms`;

    if (params.statusCode >= 500) {
      this.logger.error(message);
      return;
    }

    if (params.statusCode >= 400) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }
}
