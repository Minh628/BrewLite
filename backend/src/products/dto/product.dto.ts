export class ProductCategoryDto {
  id!: number;
  name!: string;
}

export class ProductDto {
  id!: number;
  name!: string;
  price!: number;
  imageUrl!: string | null;
  category!: ProductCategoryDto;
  isAvailable!: boolean;
}

export class ProductSizeDto {
  code!: 'S' | 'M' | 'L';
  extra!: number;
}

export class ProductDetailDto extends ProductDto {
  description!: string | null;
  sizes!: ProductSizeDto[];
}

export class ToppingDto {
  id!: number;
  name!: string;
  price!: number;
}
