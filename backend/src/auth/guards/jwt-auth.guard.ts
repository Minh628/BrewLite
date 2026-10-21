import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard áp dụng JwtStrategy để bảo vệ các endpoint yêu cầu xác thực Bearer token.
 * Kế thừa từ AuthGuard('jwt') của @nestjs/passport.
 * Bắt và chuẩn hóa các ngoại lệ: thiếu token, token sai hoặc token hết hạn thành HTTP 401 Unauthorized.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Xử lý kết quả xác thực từ Passport JwtStrategy
   * @param err Lỗi hệ thống nếu có
   * @param user Thông tin user đã giải mã từ JWT payload
   * @param info Thông tin bổ sung từ passport-jwt (chứa TokenExpiredError, JsonWebTokenError, v.v.)
   * @param _context ExecutionContext của NestJS
   * @returns User context nếu xác thực thành công
   */
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    _context: ExecutionContext,
    _status?: any,
  ): TUser {
    // Nếu có lỗi hệ thống phát sinh, ném lại lỗi để không nuốt mất stack trace
    if (err) {
      throw err;
    }

    // Nếu không có user (token không hợp lệ, hết hạn hoặc không được cung cấp trong Authorization header)
    if (!user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token đã hết hạn');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token không hợp lệ');
      }
      throw new UnauthorizedException('Unauthorized');
    }

    return user;
  }
}
