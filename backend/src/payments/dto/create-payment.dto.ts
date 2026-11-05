import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 1001 })
  @IsInt()
  @Min(1)
  orderId!: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CARD })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({ example: '4242 4242 4242 4242' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}(?: ?\d{4}){3}$/, { message: 'Số thẻ phải gồm 16 chữ số' })
  cardNumber?: string;
}
