import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoryDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * @route GET /categories — danh mục đang hoạt động cho tab lọc menu (PB-18)
   */
  @Get()
  @ApiOperation({ summary: 'Danh mục đang hoạt động' })
  @ApiOkResponse({ type: [CategoryDto] })
  findAll(): Promise<CategoryDto[]> {
    return this.productsService.findAllCategories();
  }
}
