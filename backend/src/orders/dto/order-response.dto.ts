import { OrderStatus } from '@prisma/client';
import { OrderSize } from './create-order.dto';

export class CreatedOrderItemDto {
  productId!: number;
  size!: OrderSize;
  qty!: number;
  unitPrice!: number;
  lineTotal!: number;
}

/**
 * Phản hồi 201 của POST /orders theo API contract v2 (Sub-task 6.4)
 */
export class CreatedOrderDto {
  orderId!: number;
  code!: string;
  status!: OrderStatus;
  total!: number;
  items!: CreatedOrderItemDto[];
  createdAt!: string;
}
