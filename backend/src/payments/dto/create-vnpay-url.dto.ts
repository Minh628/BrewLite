import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class CreateVnpayUrlDto {
  @ApiProperty({ description: 'Mã đơn hàng cần thanh toán', example: 1001 })
  @IsInt()
  @Min(1)
  orderId!: number;

  @ApiPropertyOptional({
    description: 'Phương thức thanh toán được chọn trên giao diện',
    enum: PaymentMethod,
    default: PaymentMethod.CARD,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}
