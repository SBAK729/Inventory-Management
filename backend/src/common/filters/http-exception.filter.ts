import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client'; 
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Something went wrong. Please try again.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        message = (body as any).message ?? exception.message;
        error = (body as any).error ?? error;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Cast exception to PrismaClientKnownRequestError to stop TS unknown error
      const prismaError = exception as Prisma.PrismaClientKnownRequestError;

      if (prismaError.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        const target = (prismaError.meta?.target as string[])?.join(', ') ?? 'field';
        message = `A record with this ${target} already exists.`;
        error = 'Conflict';
      } else if (prismaError.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'The requested record could not be found.';
        error = 'Not Found';
      } else if (prismaError.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message = 'This action refers to a record that does not exist.';
        error = 'Bad Request';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = 'The request could not be processed due to a data error.';
        error = 'Bad Request';
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}