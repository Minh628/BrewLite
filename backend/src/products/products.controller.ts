import { Controller, Get, Param } from '@nestjs/common';
import { ProductDetailDto, ProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): Promise<ProductDto[]> {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProductDetailDto> {
    return this.productsService.findOne(id);
  }
}
