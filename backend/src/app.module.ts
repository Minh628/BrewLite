import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { HealthController } from './health.controller';
import { AppController } from './app.controller';

@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, ProductsModule],
    controllers: [AppController, HealthController]
})
export class AppModule { }
