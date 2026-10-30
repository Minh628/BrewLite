import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

/**
 * Passport Local Strategy để xác thực qua email và mật khẩu
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  /**
   * Phương thức validate được Passport gọi tự động khi sử dụng AuthGuard('local')
   * @param email Email đăng nhập
   * @param password Mật khẩu đăng nhập
   * @throws UnauthorizedException khi thông tin đăng nhập không hợp lệ
   */
  async validate(email: string, password: string): Promise<{ id: number; email: string }> {
    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
