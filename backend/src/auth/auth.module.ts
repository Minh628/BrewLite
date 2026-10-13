import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * Module quản lý định danh và bảo mật (Authentication) của BrewLite
 */
@Module({
  imports: [
    PrismaModule,
    // Đăng ký JwtModule bất đồng bộ để nạp secret key và thời hạn từ biến môi trường
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'brewlite_jwt_secret_dev_key_2026'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') as
            `${number}d` | `${number}h` | `${number}m` | `${number}s`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
