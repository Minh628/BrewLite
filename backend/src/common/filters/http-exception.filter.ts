import { randomUUID } from 'node:crypto';
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
 * Định dạng đầu ra thông thường: { statusCode, message, error, path, timestamp }
 * Định dạng Production 500: { statusCode: 500, message: "Internal server error", requestId, timestamp }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Trích xuất hoặc khởi tạo requestId để truy vết log (Request Tracing)
    const headerRequestId = request.headers['x-request-id'];
    const requestId =
      (Array.isArray(headerRequestId) ? headerRequestId[0] : headerRequestId) || randomUUID();

    // Luôn đính kèm header X-Request-Id vào response để client / DevOps tiện đối chiếu tra cứu
    response.setHeader('X-Request-Id', requestId);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    // Xử lý nếu là HttpException của NestJS (bao gồm cả BadRequest từ ValidationPipe hoặc ThrottlerException 429)
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

      // Chuẩn hóa tên lỗi và thông điệp cho HTTP status 429 Too Many Requests
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        error = 'Too Many Requests';
        if (message === 'ThrottlerException: Too Many Requests') {
          message = 'Too Many Requests';
        }
      }
    } else if (exception instanceof Error) {
      // Bắt các ngoại lệ không phải HttpException (lỗi cú pháp, DB, null pointer)
      // Không trả chi tiết lỗi nội bộ ra bên ngoài để bảo vệ an toàn thông tin
      this.logger.error(
        `[${requestId}] Unhandled Exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(`[${requestId}] Unknown Exception: ${JSON.stringify(exception)}`);
    }

    // Ghi log cảnh báo cho các lỗi client (4xx) và log lỗi cho các lỗi server (5xx)
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${requestId}] [${request.method}] ${request.url} - Status: ${status} - Error: ${error}`,
      );
    } else {
      this.logger.warn(
        `[${requestId}] [${request.method}] ${request.url} - Status: ${status} - Error: ${error}`,
      );
    }

    // Bảo mật: Ở môi trường Production, khi gặp lỗi máy chủ nội bộ (>= 500)
    // Tuyệt đối không để lộ stack trace hay cấu trúc schema database ra bên ngoài
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        requestId,
        timestamp: new Date().toISOString(),
      });
      return;
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
