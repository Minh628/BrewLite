import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductCategoryDto {
  @ApiProperty({ example: 'clx1abc230000' })
  id!: string;

  @ApiProperty({ example: 'Cà phê' })
  name!: string;
}

export class ProductDto {
  @ApiProperty({ example: 'clx1abc230001' })
  id!: string;

  @ApiProperty({ example: 'Cà phê sữa đá' })
  name!: string;

  @ApiProperty({ description: 'Giá cơ bản (VND, size S)', example: 29000 })
  price!: number;

  @ApiProperty({ type: String, nullable: true, example: 'https://example.com/ca-phe-sua.jpg' })
  imageUrl!: string | null;

  @ApiProperty({ type: () => ProductCategoryDto })
  category!: ProductCategoryDto;

  @ApiProperty({ description: 'Sản phẩm còn bán hay không', example: true })
  isAvailable!: boolean;
}

export class ProductSizeDto {
  @ApiProperty({ enum: ['S', 'M', 'L'], example: 'M' })
  code!: 'S' | 'M' | 'L';

  @ApiProperty({ description: 'Phụ thu so với giá cơ bản (VND)', example: 5000 })
  extra!: number;
}

export class ProductDetailDto extends ProductDto {
  @ApiPropertyOptional({ type: String, nullable: true, example: 'Cà phê pha phin với sữa đặc' })
  description!: string | null;

  @ApiProperty({ type: () => [ProductSizeDto], description: 'Các size theo thứ tự S, M, L' })
  sizes!: ProductSizeDto[];
}

export class ToppingDto {
  @ApiProperty({ example: 'clx1abc230010' })
  id!: string;

  @ApiProperty({ example: 'Trân châu đen' })
  name!: string;

  @ApiProperty({ description: 'Giá topping (VND)', example: 7000 })
  price!: number;
}
