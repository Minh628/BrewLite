import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

const BARISTA_STATUSES = [OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED] as const;

export type BaristaStatus = (typeof BARISTA_STATUSES)[number];

/** DTO cho PATCH /orders/:id/status — chỉ BARISTA/ADMIN được gọi (Sub-task 10.1c). */
export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: BARISTA_STATUSES,
    description: 'Trạng thái mới (chỉ PREPARING / READY / COMPLETED)',
    example: OrderStatus.PREPARING,
  })
  @IsEnum(BARISTA_STATUSES, {
    message: `status phải là một trong: ${BARISTA_STATUSES.join(', ')}`,
  })
  status!: BaristaStatus;
}
