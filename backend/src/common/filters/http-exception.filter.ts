import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Bộ lọc ngoại lệ toàn cục chuẩn hóa cấu trúc JSON trả về cho mọi lỗi HTTP/hệ thống
 * Định dạng đầu ra: { statusCode, message, error, path, timestamp }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    // Xử lý nếu là HttpException của NestJS (bao gồm cả BadRequest từ ValidationPipe)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;

        // Bóc tách message từ class-validator (có thể là mảng chuỗi) hoặc chuỗi thông thường
        if (responseObj.message) {
          message = responseObj.message as string | string[];
        } else {
          message = exception.message;
        }

        if (typeof responseObj.error === 'string') {
          error = responseObj.error;
        } else {
          error = exception.name;
        }
      }
    } else if (exception instanceof Error) {
      // Bắt các ngoại lệ không phải HttpException (lỗi cú pháp, DB, null pointer)
      // Không trả chi tiết lỗi nội bộ ra bên ngoài để bảo vệ an toàn thông tin
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Unknown Exception: ${JSON.stringify(exception)}`);
    }

    // Ghi log cảnh báo cho các lỗi client (4xx) và log lỗi cho các lỗi server (5xx)
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`[${request.method}] ${request.url} - Status: ${status} - Error: ${error}`);
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - Status: ${status} - Error: ${error}`);
    }

    // Trả về cấu trúc JSON chuẩn hóa theo yêu cầu Sub-task 14.2
    response.status(status).json({
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
