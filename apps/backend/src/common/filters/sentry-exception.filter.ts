import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception);

    if (host.getType() === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      // If response object is available, delegate to BaseExceptionFilter
      if (response && typeof response.status === 'function') {
        try {
          super.catch(exception, host);
          return;
        } catch {
          // BaseExceptionFilter failed — handle manually
        }
      }

      // Fallback: send error response directly
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      const message =
        exception instanceof HttpException
          ? exception.message
          : 'Internal server error';

      if (response && typeof response.status === 'function') {
        response.status(status).json({
          statusCode: status,
          message,
        });
      }
    }
  }
}
