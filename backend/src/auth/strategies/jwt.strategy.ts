import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Passport JWT Strategy để xác thực Bearer token từ Authorization header
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        process.env.JWT_SECRET ||
        'brewlite_jwt_secret_dev_key_2026',
      algorithms: ['HS256'],
    });
  }

  /**
   * Phương thức validate payload của token sau khi Passport giải mã thành công
   * @param payload Dữ liệu định danh chứa sub (userId) và email
   * @returns User context gắn vào req.user
   */
  validate(payload: JwtPayload): { id: string; email: string } {
    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}
