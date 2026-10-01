import { Controller, Get } from '@nestjs/common';
import { ToppingDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@Controller('toppings')
export class ToppingsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): Promise<ToppingDto[]> {
    return this.productsService.findAllToppings();
  }
}
