import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { BEARER_AUTH } from '../swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  GetOrdersQueryDto,
  OrderDetailDto,
  PaginatedOrdersDto,
  UpdatedOrderStatusDto,
} from './dto/order-detail.dto';
import { CreatedOrderDto, ReplayedOrderDto } from './dto/order-response.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

/**
 * Controller xử lý đơn hàng (PB-06, mở rộng 9.1 + 10.1c).
 */
@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Lấy danh sách đơn hàng của người dùng hiện tại (phân trang).
   * PHẢI khai báo trước GET /:id để "me" không bị hiểu là param.
   * @route GET /orders/me
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Lịch sử đơn hàng của tôi (phân trang)',
    description: 'Trả về danh sách đơn hàng của người dùng hiện tại, mới nhất trước.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOkResponse({ type: PaginatedOrdersDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async getMyOrders(
    @CurrentUser('id') userId: number,
    @Query() query: GetOrdersQueryDto,
  ): Promise<PaginatedOrdersDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    return this.ordersService.findMyOrders(userId, page, limit);
  }

  /**
   * Lấy chi tiết một đơn hàng theo ID (chỉ đơn của chính mình).
   * @route GET /orders/:id
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({ summary: 'Chi tiết đơn hàng' })
  @ApiOkResponse({ type: OrderDetailDto })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Không tìm thấy đơn hàng' })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async getOrderById(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) orderId: number,
  ): Promise<OrderDetailDto> {
    return this.ordersService.findById(userId, orderId);
  }

  /**
   * Chuyển trạng thái đơn hàng — chỉ BARISTA / ADMIN.
   * Trạng thái hợp lệ: PREPARING, READY, COMPLETED.
   * State Machine kiểm tra cặp chuyển đổi; sai → 409 INVALID_TRANSITION.
   * @route PATCH /orders/:id/status
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BARISTA, Role.ADMIN)
  @Patch(':id/status')
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({ summary: 'Quầy pha chế cập nhật trạng thái đơn (BARISTA/ADMIN)' })
  @ApiOkResponse({ type: UpdatedOrderStatusDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiForbiddenResponse({ type: ApiErrorDto, description: '403 FORBIDDEN_ROLE' })
  @ApiConflictResponse({ type: ApiErrorDto, description: '409 INVALID_TRANSITION' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async updateStatus(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<UpdatedOrderStatusDto> {
    return this.ordersService.updateStatus(orderId, dto.status);
  }

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
