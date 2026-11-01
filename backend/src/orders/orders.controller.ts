import { Body, Controller, Headers, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { BEARER_AUTH } from '../swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatedOrderDto, ReplayedOrderDto } from './dto/order-response.dto';
import { OrdersService } from './orders.service';

/**
 * Controller xử lý đơn hàng (PB-06, mở rộng 10.2b + 10.4b).
 */
@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Endpoint tạo đơn hàng từ giỏ hàng.
   * - Mã giảm giá: `promoCode` trong body (Sub-task 10.4b).
   * - Chống tạo trùng: header `Idempotency-Key` (Sub-task 10.2b). Cùng user + cùng key
   *   chỉ tạo 1 đơn; request lặp lại trả 200 kèm `replayed: true`.
   *
   * @route POST /orders
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Tạo đơn hàng PENDING từ giỏ',
    description:
      'Server tự tính giá từ DB; mọi trường giá client gửi kèm đều bị bỏ qua. ' +
      'Áp mã giảm giá qua promoCode. Gửi Idempotency-Key để chống tạo trùng đơn.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Khóa chống tạo trùng đơn (uuid). Request lặp lại với cùng key trả lại đơn cũ.',
    example: '5f0c1f4e-8a1d-4b9e-9c2b-77d1a0f3c2a1',
  })
  @ApiCreatedResponse({ type: CreatedOrderDto, description: 'Đơn mới được tạo' })
  @ApiOkResponse({
    type: ReplayedOrderDto,
    description: 'Trả lại đơn đã tạo với cùng Idempotency-Key',
  })
  @ApiBadRequestResponse({
    type: ApiErrorDto,
    description: 'Sai DTO, sản phẩm/topping không tồn tại hoặc mã giảm giá không hợp lệ (PROMO_*)',
  })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'Xung đột dữ liệu khi tạo đơn' })
  @ApiUnauthorizedResponse({ type: ApiErrorDto, description: 'Thiếu hoặc sai Bearer token' })
  async create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CreatedOrderDto> {
    const result = await this.ordersService.create(userId, dto, { idempotencyKey });

    // HTTP 200 khi trả lại đơn đã tạo (Idempotent-Replayed), 201 khi tạo mới
    const { replayed, ...order } = result;
    response.status(replayed ? HttpStatus.OK : HttpStatus.CREATED);
    if (replayed) {
      response.setHeader('Idempotent-Replayed', 'true');
    }
    return order;
  }
}
