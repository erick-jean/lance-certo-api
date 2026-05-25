import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

type ErrorMessage = string | string[] | Record<string, unknown>;

type NormalizedErrorResponse = {
  statusCode: number;
  message: ErrorMessage;
  error: string;
  path: string;
  method: string;
  timestamp: string;
};

type HttpExceptionResponseBody = {
  statusCode?: number;
  message?: ErrorMessage;
  error?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const timestamp = new Date().toISOString();

    const payload =
      exception instanceof HttpException
        ? this.buildHttpExceptionResponse(exception, request, timestamp)
        : this.buildUnexpectedErrorResponse(exception, request, timestamp);

    response.status(payload.statusCode).json(payload);
  }

  private buildHttpExceptionResponse(
    exception: HttpException,
    request: Request,
    timestamp: string,
  ): NormalizedErrorResponse {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return this.createResponse({
        statusCode,
        message: exceptionResponse,
        error: this.getHttpErrorName(statusCode, exception.name),
        request,
        timestamp,
      });
    }

    const responseBody = this.isHttpExceptionResponseBody(exceptionResponse)
      ? exceptionResponse
      : {};

    return this.createResponse({
      statusCode,
      message: responseBody.message ?? exception.message,
      error:
        responseBody.error ?? this.getHttpErrorName(statusCode, exception.name),
      request,
      timestamp,
    });
  }

  private buildUnexpectedErrorResponse(
    exception: unknown,
    request: Request,
    timestamp: string,
  ): NormalizedErrorResponse {
    const message =
      exception instanceof Error
        ? exception.message
        : 'Erro inesperado sem mensagem.';
    const shouldLogStack =
      exception instanceof Error &&
      this.configService.get<string>('NODE_ENV') !== 'production';
    const stack = shouldLogStack ? exception.stack : undefined;

    this.logger.error(message, stack);

    return this.createResponse({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno do servidor.',
      error: 'Internal Server Error',
      request,
      timestamp,
    });
  }

  private createResponse(params: {
    statusCode: number;
    message: ErrorMessage;
    error: string;
    request: Request;
    timestamp: string;
  }): NormalizedErrorResponse {
    return {
      statusCode: params.statusCode,
      message: params.message,
      error: params.error,
      path: this.getSafeRequestPath(params.request),
      method: params.request.method,
      timestamp: params.timestamp,
    };
  }

  private isHttpExceptionResponseBody(
    value: unknown,
  ): value is HttpExceptionResponseBody {
    return typeof value === 'object' && value !== null;
  }

  private getHttpErrorName(statusCode: number, fallback: string): string {
    return HttpStatus[statusCode] ?? fallback;
  }

  private getSafeRequestPath(request: Request): string {
    return request.originalUrl.split('?')[0];
  }
}
