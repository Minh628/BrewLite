import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ProductDetailDto, ProductDto } from './dto/product.dto';
import { ProductsQueryDto } from './dto/products-query.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * @route GET /products?category={id}&q={keyword}
   */
  @Get()
  findAll(@Query() query: ProductsQueryDto): Promise<ProductDto[]> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductDetailDto> {
    return this.productsService.findOne(id);
  }
}
