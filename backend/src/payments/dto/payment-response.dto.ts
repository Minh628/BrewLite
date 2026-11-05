import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export class PaymentResponseDto {
  @ApiProperty()
  orderId!: number;

  @ApiProperty()
  amount!: number;

  @ApiProperty({ enum: PaymentMethod })
  method!: PaymentMethod;

  @ApiProperty({ enum: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED] })
  status!: OrderStatus;

  @ApiPropertyOptional({ nullable: true })
  cardLast4?: string | null;

  @ApiPropertyOptional({ nullable: true })
  failureReason?: string | null;
}
