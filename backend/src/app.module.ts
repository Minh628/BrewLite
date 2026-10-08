import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { ProductsModule } from './products/products.module';
import { PricingModule } from './pricing/pricing.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, ProductsModule, PricingModule],
  controllers: [AppController],
})
export class AppModule {}
