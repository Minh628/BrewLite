import { randomUUID } from 'node:crypto';
import { Request } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-Id';

/** Chỉ nhận requestId do client gửi nếu an toàn để ghi log (chống chèn ký tự xuống dòng giả log) */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;

export type RequestWithId = Request & { requestId?: string };

/**
 * Lấy requestId đã gắn cho request; nếu chưa có thì lấy từ header X-Request-Id hợp lệ
 * hoặc sinh UUID mới, rồi lưu lại trên request để middleware, filter và log dùng chung một mã.
 */
export function resolveRequestId(request: Request): string {
  const req = request as RequestWithId;
  if (req.requestId) {
    return req.requestId;
  }

  const header = req.headers['x-request-id'];
  const candidate = Array.isArray(header) ? header[0] : header;
  req.requestId = candidate && SAFE_REQUEST_ID.test(candidate) ? candidate : randomUUID();
  return req.requestId;
}
