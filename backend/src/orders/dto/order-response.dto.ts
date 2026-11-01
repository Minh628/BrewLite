import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { ORDER_SIZES, OrderSize } from './create-order.dto';

export class CreatedOrderItemDto {
  @ApiProperty({ example: 3 })
  productId!: number;

  @ApiProperty({ enum: ORDER_SIZES, example: 'L' })
  size!: OrderSize;

  @ApiProperty({ example: 2 })
  qty!: number;

  @ApiProperty({ description: 'Đơn giá do server tính (VND)', example: 67000 })
  unitPrice!: number;

  @ApiProperty({ description: 'unitPrice × qty (VND)', example: 134000 })
  lineTotal!: number;
}

/**
 * Phản hồi 201 của POST /orders theo API contract v2 (Sub-task 6.4)
 */
export class CreatedOrderDto {
  @ApiProperty({ example: 1001 })
  orderId!: number;

  @ApiProperty({ example: '#1001' })
  code!: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status!: OrderStatus;

  @ApiProperty({ description: 'Tổng tiền trước giảm giá do server tính (VND)', example: 178000 })
  subtotal!: number;

  @ApiProperty({ description: 'Số tiền được giảm (VND)', example: 17800 })
  discount!: number;

  @ApiProperty({
    description: 'Mã giảm giá đã áp (IN HOA), null nếu không áp mã',
    example: 'BREW10',
    nullable: true,
  })
  promoCode!: string | null;

  @ApiProperty({ description: 'Tổng tiền phải trả = subtotal − discount (VND)', example: 160200 })
  total!: number;

  @ApiProperty({ type: () => [CreatedOrderItemDto] })
  items!: CreatedOrderItemDto[];

  @ApiProperty({ example: '2026-10-24T10:00:00.000Z' })
  createdAt!: string;
}

/**
 * Phản hồi khi trả lại đơn đã tạo bằng cùng Idempotency-Key (Sub-task 10.2b).
 */
export class ReplayedOrderDto extends CreatedOrderDto {
  @ApiProperty({ example: true, description: 'Đơn đã tồn tại, không tạo mới' })
  replayed!: boolean;
}
