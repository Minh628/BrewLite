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
import { CancelOrderDto } from './dto/cancel-order.dto';
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
   * Hàng đợi quầy pha chế (PB-32a): trả tất cả đơn ở PAID/PREPARING/READY, FIFO.
   * Chỉ BARISTA/ADMIN. PHẢI khai báo trước GET /:id để "queue" không bị parse thành :id.
   * @route GET /orders/queue
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BARISTA, Role.ADMIN)
  @Get('queue')
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({ summary: 'Hàng đợi quầy pha chế (BARISTA/ADMIN)' })
  @ApiOkResponse({ type: OrderDetailDto, isArray: true })
  @ApiForbiddenResponse({ type: ApiErrorDto, description: '403 FORBIDDEN_ROLE' })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async getBaristaQueue(): Promise<OrderDetailDto[]> {
    return this.ordersService.getQueue();
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
   * Hủy đơn hàng — Khách hàng (hủy đơn của mình) hoặc Barista/Admin (hủy tại quầy).
   * Chỉ cho phép hủy khi đơn ở PENDING, PAYMENT_FAILED hoặc PAID.
   * State Machine chặn nếu đơn đã sang PREPARING/READY/COMPLETED/CANCELLED.
   * @route POST /orders/:id/cancel
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Hủy đơn hàng (Khách hàng hoặc Barista)',
    description:
      'Chỉ hủy được khi đơn ở PENDING, PAYMENT_FAILED hoặc PAID. Khi đơn PAID bị hủy, điểm thưởng và mã giảm giá sẽ được tự động hoàn trả.',
  })
  @ApiOkResponse({
    type: UpdatedOrderStatusDto,
    description: 'Đơn hàng đã được chuyển sang CANCELLED',
  })
  @ApiForbiddenResponse({ type: ApiErrorDto, description: 'Không có quyền hủy đơn hàng này' })
  @ApiConflictResponse({
    type: ApiErrorDto,
    description: '409 INVALID_TRANSITION khi đơn đã bắt đầu pha chế',
  })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Không tìm thấy đơn hàng' })
  async cancelOrder(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string | undefined,
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CancelOrderDto,
  ): Promise<UpdatedOrderStatusDto> {
    return this.ordersService.cancel(userId, role, orderId, dto.reason);
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
