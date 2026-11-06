import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, Min } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class SimulatePaymentDto {
  @ApiProperty({ example: 1, description: 'ID của đơn hàng cần thay đổi trạng thái' })
  @IsInt({ message: 'orderId phải là số nguyên' })
  @Min(1, { message: 'orderId phải lớn hơn 0' })
  orderId!: number;

  @ApiProperty({
    enum: ['PAID', 'PAYMENT_FAILED'],
    example: 'PAID',
    description: 'Trạng thái thanh toán từ bên thứ 3 mô phỏng (PAID hoặc PAYMENT_FAILED)',
  })
  @IsIn(['PAID', 'PAYMENT_FAILED'], {
    message: 'status chỉ được phép là PAID hoặc PAYMENT_FAILED',
  })
  status!: 'PAID' | 'PAYMENT_FAILED';
}

export class SimulatePaymentResponseDto {
  @ApiProperty({ example: 1, description: 'ID đơn hàng' })
  orderId!: number;

  @ApiProperty({ enum: OrderStatus, example: 'PAID', description: 'Trạng thái mới của đơn hàng' })
  status!: OrderStatus;

  @ApiProperty({
    example: 'Cập nhật trạng thái thanh toán mô phỏng thành công',
    description: 'Thông báo kết quả',
  })
  message!: string;
}
