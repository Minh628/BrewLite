export type Category = {
  id: number;
  name: string;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  category: Category;
  isAvailable: boolean;
  inStock?: boolean;
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
  code?: string;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
};

export type OrderStatus =
  'PENDING' | 'PAID' | 'PAYMENT_FAILED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type OrderItemToppingDetail = {
  id: number;
  name: string;
  price: number;
};

export type OrderItemDetail = {
  productId: number;
  productName: string;
  size: 'S' | 'M' | 'L';
  qty: number;
  unitPrice: number;
  lineTotal: number;
  toppings: OrderItemToppingDetail[];
};

export type OrderPaymentInfo = {
  method: 'CARD' | 'WALLET';
  cardLast4?: string | null;
  paidAt?: string | null;
};

export type OrderDetail = {
  orderId: number;
  code: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  promoCode?: string | null;
  total: number;
  pointsEarned: number;
  createdAt: string;
  items: OrderItemDetail[];
  payment?: OrderPaymentInfo | null;
};

export type OrderSummary = {
  orderId: number;
  code: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
};

export type PaginatedOrders = {
  items: OrderSummary[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};
