import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard áp dụng LocalStrategy cho endpoint đăng nhập
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
