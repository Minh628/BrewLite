import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ToppingDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('toppings')
export class ToppingsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách topping đang bán' })
  @ApiOkResponse({ type: [ToppingDto] })
  findAll(): Promise<ToppingDto[]> {
    return this.productsService.findAllToppings();
  }
}
