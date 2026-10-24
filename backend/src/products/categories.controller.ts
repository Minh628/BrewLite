import { Controller, Get } from '@nestjs/common';
import { CategoryDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * @route GET /categories — danh mục đang hoạt động cho tab lọc menu (PB-18)
   */
  @Get()
  findAll(): Promise<CategoryDto[]> {
    return this.productsService.findAllCategories();
  }
}
