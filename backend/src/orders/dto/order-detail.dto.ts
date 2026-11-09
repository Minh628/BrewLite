import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod, Size } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Query params cho GET /orders/me (Sub-task 9.1). */
export class GetOrdersQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Trang hiện tại' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50, description: 'Số đơn mỗi trang' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

/** Tóm tắt một đơn trong danh sách "Đơn của tôi". */
export class OrderSummaryDto {
  @ApiProperty({ example: 1001 })
  orderId!: number;

  @ApiProperty({ example: '#1001' })
  code!: string;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty({ description: 'Tổng tiền phải trả (VND)', example: 160200 })
  total!: number;

  @ApiProperty({ description: 'Số lượng dòng món', example: 3 })
  itemCount!: number;

  @ApiProperty({ example: '2026-11-02T08:00:00.000Z' })
  createdAt!: string;
}

/** Phản hồi phân trang cho GET /orders/me. */
export class PaginatedOrdersDto {
  @ApiProperty({ type: () => [OrderSummaryDto] })
  items!: OrderSummaryDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 12 })
  totalItems!: number;

  @ApiProperty({ example: 2 })
  totalPages!: number;
}

/** Topping trong chi tiết đơn. */
export class OrderItemToppingDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Trân châu' })
  name!: string;

  @ApiProperty({ example: 10000 })
  price!: number;
}

/** Dòng món trong chi tiết đơn. */
export class OrderItemDetailDto {
  @ApiProperty({ example: 3 })
  productId!: number;

  @ApiProperty({ example: 'Cappuccino' })
  productName!: string;

  @ApiProperty({ enum: Size, example: Size.L })
  size!: Size;

  @ApiProperty({ example: 2 })
  qty!: number;

  @ApiProperty({ example: 67000 })
  unitPrice!: number;

  @ApiProperty({ example: 134000 })
  lineTotal!: number;

  @ApiProperty({ type: () => [OrderItemToppingDto] })
  toppings!: OrderItemToppingDto[];
}

/** Thông tin thanh toán gần nhất. */
export class OrderPaymentInfoDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CARD })
  method!: PaymentMethod;

  @ApiPropertyOptional({ example: '4242', nullable: true })
  cardLast4?: string | null;

  @ApiPropertyOptional({ example: '2026-11-02T08:30:00.000Z', nullable: true })
  paidAt?: string | null;
}

/** Phản hồi đầy đủ cho GET /orders/:id (Sub-task 9.1). */
export class OrderDetailDto {
  @ApiProperty({ example: 1001 })
  orderId!: number;

  @ApiProperty({ example: '#1001' })
  code!: string;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty({ example: 178000 })
  subtotal!: number;

  @ApiProperty({ example: 17800 })
  discount!: number;

  @ApiPropertyOptional({ example: 'BREW10', nullable: true })
  promoCode!: string | null;

  @ApiProperty({ example: 160200 })
  total!: number;

  @ApiProperty({ example: 16 })
  pointsEarned!: number;

  @ApiProperty({ example: '2026-11-02T08:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: () => [OrderItemDetailDto] })
  items!: OrderItemDetailDto[];

  @ApiPropertyOptional({ type: () => OrderPaymentInfoDto, nullable: true })
  payment?: OrderPaymentInfoDto | null;
}

/** Phản hồi ngắn gọn cho PATCH /orders/:id/status. */
export class UpdatedOrderStatusDto {
  @ApiProperty({ example: 1001 })
  orderId!: number;

  @ApiProperty({ example: '#1001' })
  code!: string;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;
}
