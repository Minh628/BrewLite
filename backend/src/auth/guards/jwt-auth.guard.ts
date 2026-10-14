import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard áp dụng JwtStrategy để bảo vệ các endpoint yêu cầu xác thực
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
