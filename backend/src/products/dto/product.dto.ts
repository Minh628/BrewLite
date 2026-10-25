import { ApiProperty } from '@nestjs/swagger';

export class ProductCategoryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Cà phê' })
  name!: string;
}

export class CategoryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Cà phê' })
  name!: string;
}

export class ProductDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 'Cappuccino' })
  name!: string;

  @ApiProperty({ description: 'Giá cơ bản size S (VND)', example: 45000 })
  price!: number;

  @ApiProperty({ type: String, nullable: true, example: '/cappuccino.svg' })
  imageUrl!: string | null;

  @ApiProperty({ type: () => ProductCategoryDto })
  category!: ProductCategoryDto;

  @ApiProperty({ description: 'Sản phẩm còn bán hay không', example: true })
  isAvailable!: boolean;
}

export class ProductSizeDto {
  @ApiProperty({ enum: ['S', 'M', 'L'], example: 'M' })
  code!: 'S' | 'M' | 'L';

  @ApiProperty({ description: 'Phụ thu so với size S (VND)', example: 5000 })
  extra!: number;
}

export class ProductDetailDto extends ProductDto {
  @ApiProperty({ type: String, nullable: true, example: 'Espresso, sữa nóng, lớp bọt mịn' })
  description!: string | null;

  @ApiProperty({ type: () => [ProductSizeDto] })
  sizes!: ProductSizeDto[];
}

export class ToppingDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Trân châu đen' })
  name!: string;

  @ApiProperty({ description: 'Giá topping (VND)', example: 5000 })
  price!: number;
}
