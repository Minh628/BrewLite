import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { ProductDetailDto, ProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách menu',
    description: 'Trả về các sản phẩm đang bán, sắp xếp theo tên danh mục rồi tên sản phẩm.',
  })
  @ApiOkResponse({ type: [ProductDto] })
  findAll(): Promise<ProductDto[]> {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Chi tiết sản phẩm',
    description: 'Trả về mô tả và các size (S, M, L) kèm phụ thu của một sản phẩm.',
  })
  @ApiParam({ name: 'id', description: 'ID sản phẩm', example: 'clx1abc230001' })
  @ApiOkResponse({ type: ProductDetailDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy sản phẩm', type: ApiErrorDto })
  findOne(@Param('id') id: string): Promise<ProductDetailDto> {
    return this.productsService.findOne(id);
  }
}
