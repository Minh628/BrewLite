import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { ProductsModule } from './products/products.module';
import { PricingModule } from './pricing/pricing.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Cấu hình ThrottlerModule để giới hạn tần suất gửi request, chống tấn công brute-force và DDoS
    ThrottlerModule.forRoot([
      {
        ttl: (Number(process.env.THROTTLE_TTL) || 60) * 1000, // Đơn vị ms: mặc định 60.000 ms (60 giây)
        limit: Number(process.env.THROTTLE_LIMIT) || 100, // Mặc định 100 requests/phút cho toàn hệ thống
      },
    ]),
    PrismaModule,
    AuthModule,
    ProductsModule,
    PricingModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [
    // Kích hoạt ThrottlerGuard toàn cục để bảo vệ các endpoint theo cấu hình mặc định hoặc ghi đè bằng @Throttle
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
