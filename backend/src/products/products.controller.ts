import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { ProductDetailDto, ProductDto } from './dto/product.dto';
import { ProductsQueryDto } from './dto/products-query.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * @route GET /products?category={id}&q={keyword}
   */
  @Get()
  @ApiOperation({
    summary: 'Danh sách món đang bán',
    description: 'Lọc theo danh mục và tìm theo tên. Không có kết quả thì trả mảng rỗng.',
  })
  @ApiOkResponse({ type: [ProductDto] })
  @ApiBadRequestResponse({ type: ApiErrorDto, description: 'category hoặc q không hợp lệ' })
  findAll(@Query() query: ProductsQueryDto): Promise<ProductDto[]> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết món kèm các size' })
  @ApiOkResponse({ type: ProductDetailDto })
  @ApiBadRequestResponse({ type: ApiErrorDto, description: 'id không phải số' })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Món không tồn tại hoặc ngừng bán' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductDetailDto> {
    return this.productsService.findOne(id);
  }
}
