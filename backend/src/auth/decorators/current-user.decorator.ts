import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Interface định nghĩa dữ liệu user gắn trong request sau khi JwtStrategy xác thực
 */
export interface CurrentUserPayload {
  id: number;
  email: string;
  [key: string]: any;
}

/**
 * Custom Param Decorator trích xuất thông tin người dùng từ request context.
 *
 * Hỗ trợ:
 * - @CurrentUser() user: Lấy toàn bộ user context ({ id, email })
 * - @CurrentUser('id') userId: number: Chỉ lấy thuộc tính id
 * - @CurrentUser('email') email: string: Chỉ lấy thuộc tính email
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Trả về undefined nếu không có user context (chưa qua Guard hoặc không xác thực)
    if (!user) {
      return undefined;
    }

    // Nếu có chỉ định property con thì lấy thuộc tính đó, ngược lại trả về toàn bộ user
    return data ? user[data] : user;
  },
);
