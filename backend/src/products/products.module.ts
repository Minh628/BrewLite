import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ToppingsController } from './toppings.controller';

@Module({
  controllers: [ProductsController, ToppingsController],
  providers: [ProductsService],
})
export class ProductsModule {}
