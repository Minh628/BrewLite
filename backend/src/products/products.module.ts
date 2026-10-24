import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ToppingsController } from './toppings.controller';

@Module({
  controllers: [ProductsController, ToppingsController, CategoriesController],
  providers: [ProductsService],
})
export class ProductsModule {}
