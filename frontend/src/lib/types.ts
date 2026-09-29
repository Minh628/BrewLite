export type Category = {
  id: number;
  name: string;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  category: Category;
  isAvailable: boolean;
};

export type ProductSize = {
  code: 'S' | 'M' | 'L';
  extra: number;
};

export type ProductDetail = Product & {
  description: string | null;
  sizes: ProductSize[];
};

export type Topping = {
  id: number;
  name: string;
  price: number;
};

export type ApiErrorBody = {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
};
