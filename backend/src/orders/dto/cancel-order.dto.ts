import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({
    example: 'Khách đổi ý muốn đặt món khác',
    description: 'Lý do hủy đơn hàng (tùy chọn)',
  })
  @IsOptional()
  @IsString({ message: 'Lý do hủy phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Lý do hủy không vượt quá 255 ký tự' })
  reason?: string;
}
