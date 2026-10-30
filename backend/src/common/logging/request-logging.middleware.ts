import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { REQUEST_ID_HEADER, resolveRequestId } from './request-id';

/**
 * Ghi một dòng log cho mỗi request (PB-23 / Sub-task 23.1):
 * `[requestId] METHOD url status thời_gianms`
 *
 * Dùng middleware thay cho interceptor vì interceptor chạy sau guard: request bị JwtAuthGuard (401),
 * ThrottlerGuard (429) chặn hoặc route không tồn tại (404) sẽ không bao giờ tới interceptor.
 * Middleware chạy đầu tiên và log khi response kết thúc nên bắt được mọi trường hợp.
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = resolveRequestId(req);
    const startedAt = process.hrtime.bigint();
    const { method, originalUrl } = req;

    res.setHeader(REQUEST_ID_HEADER, requestId);

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      const line = `[${requestId}] ${method} ${originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`;

      if (res.statusCode >= 500) {
        this.logger.error(line);
      } else if (res.statusCode >= 400) {
        this.logger.warn(line);
      } else {
        this.logger.log(line);
      }
    });

    next();
  }
}
