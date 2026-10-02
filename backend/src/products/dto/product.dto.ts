export class ProductCategoryDto {
  id!: string;
  name!: string;
}

export class ProductDto {
  id!: string;
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
  id!: string;
  name!: string;
  price!: number;
}
