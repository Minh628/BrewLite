import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { ProductsModule } from './products/products.module';
import { PricingModule } from './pricing/pricing.module';

import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    PricingModule,
    OrdersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
