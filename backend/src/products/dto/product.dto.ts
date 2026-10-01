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
