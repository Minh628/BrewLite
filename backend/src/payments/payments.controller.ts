import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { OrderStatusService } from '../orders/order-status.service';
import { PrismaService } from '../prisma/prisma.service';
import { BEARER_AUTH } from '../swagger';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateVnpayUrlDto } from './dto/create-vnpay-url.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { SimulatePaymentDto, SimulatePaymentResponseDto } from './dto/simulate-payment.dto';
import { PaymentsService } from './payments.service';
import { VnpayService } from './vnpay.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly vnpayService: VnpayService,
    private readonly prisma: PrismaService,
    private readonly orderStatusService: OrderStatusService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({ summary: 'Thanh toán mock cho một đơn hàng' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOkResponse({ type: PaymentResponseDto, description: 'Thanh toán được xử lý hoặc phát lại' })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiConflictResponse({ type: ApiErrorDto })
  @ApiUnprocessableEntityResponse({ type: ApiErrorDto })
  async create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PaymentResponseDto> {
    const result = await this.paymentsService.create(userId, dto, idempotencyKey);
    response.status(result.replayed ? HttpStatus.OK : HttpStatus.CREATED);
    if (result.replayed) response.setHeader('Idempotent-Replayed', 'true');
    return result.payment;
  }

  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mô phỏng cổng thanh toán bên thứ 3 (VNPay/Mock) đổi trạng thái (Test qua Swagger)',
    description:
      'Chuyển trạng thái đơn: PENDING -> PAID hoặc PAYMENT_FAILED; hoặc PAYMENT_FAILED -> PAID. Kích hoạt hook tích điểm khi PAID.',
  })
  @ApiOkResponse({
    type: SimulatePaymentResponseDto,
    description: 'Trạng thái đơn hàng sau khi đổi thành công',
  })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Không tìm thấy đơn hàng' })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'Chuyển trạng thái không hợp lệ' })
  async simulate(@Body() dto: SimulatePaymentDto): Promise<SimulatePaymentResponseDto> {
    return this.paymentsService.simulate(dto);
  }

  /**
   * 1. Tạo URL chuyển hướng sang cổng thanh toán VNPay Sandbox v2.1.0
   * @route POST /payments/vnpay/create-url
   */
  @UseGuards(JwtAuthGuard)
  @Post('vnpay/create-url')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Tạo URL thanh toán VNPay Sandbox cho đơn hàng',
    description:
      'Tạo liên kết thanh toán VNPay v2.1.0 với chữ ký số HMAC-SHA512. Khách duyệt web sẽ được chuyển hướng sang cổng VNPay.',
  })
  @ApiOkResponse({ description: 'Đường dẫn chuyển hướng cổng thanh toán VNPay' })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Không tìm thấy đơn hàng' })
  @ApiForbiddenResponse({
    type: ApiErrorDto,
    description: 'Không có quyền thanh toán cho đơn hàng này',
  })
  @ApiConflictResponse({
    type: ApiErrorDto,
    description: 'Đơn hàng không ở trạng thái cho phép thanh toán',
  })
  async createVnpayUrl(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateVnpayUrlDto,
    @Req() req: Request,
  ): Promise<{ paymentUrl: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${dto.orderId}`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thanh toán cho đơn hàng này');
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAYMENT_FAILED) {
      throw new ConflictException(
        `Đơn hàng #${order.id} hiện ở trạng thái ${order.status}, không thể thanh toán tiếp`,
      );
    }

    const ipAddr =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const paymentUrl = this.vnpayService.createPaymentUrl({
      orderId: order.id,
      amount: order.total,
      method: dto.method,
      ipAddr,
    });

    return { paymentUrl };
  }

  /**
   * 2. IPN Webhook: Máy chủ VNPay gọi ngầm để xác nhận kết quả giao dịch (Server-to-Server)
   * Trả về các mã chuẩn của VNPay:
   * - 00: Ghi nhận thành công
   * - 01: Đơn hàng không tồn tại
   * - 02: Đơn hàng đã được xác nhận trước đó
   * - 04: Số tiền không hợp lệ
   * - 97: Chữ ký không hợp lệ (Fail checksum)
   * @route GET /payments/vnpay/ipn
   */
  @Get('vnpay/ipn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook IPN từ máy chủ VNPay Sandbox (Server-to-Server)',
  })
  async handleVnpayIpn(
    @Query() query: Record<string, any>,
  ): Promise<{ RspCode: string; Message: string }> {
    const verify = this.vnpayService.verifyCallback(query);

    // 1. Kiểm tra chữ ký bảo mật (Checksum)
    if (!verify.isValid) {
      return { RspCode: '97', Message: 'Fail checksum' };
    }

    // 2. Tra cứu đơn hàng trong CSDL
    const order = await this.prisma.order.findUnique({
      where: { id: verify.orderId },
    });

    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // 3. Kiểm tra số tiền thanh toán có khớp với tổng đơn hàng
    if (order.total !== verify.amount) {
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    // 4. Kiểm tra đơn hàng đã được xác nhận trước đó chưa (tránh xử lý trùng lặp)
    if (order.status === OrderStatus.PAID || order.status === OrderStatus.COMPLETED) {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // 5. Cập nhật trạng thái đơn hàng và lưu lịch sử thanh toán trong transaction an toàn
    const txNo =
      verify.transactionNo && verify.transactionNo !== '0' ? verify.transactionNo : `${Date.now()}`;
    const idempotencyKey = randomUUID();
    const requestHash = createHash('sha256')
      .update(`vnpay|${order.id}|${verify.method}|${txNo}|${verify.responseCode}`)
      .digest('hex');

    try {
      await this.prisma.$transaction(async (tx) => {
        // Khóa bản ghi để ngăn chặn race condition giữa IPN và Return URL
        const locked = await tx.$queryRaw<Array<{ id: number; status: OrderStatus }>>`
          SELECT id, status FROM "Order" WHERE id = ${order.id} FOR UPDATE
        `;
        if (!locked.length || locked[0].status === OrderStatus.PAID) {
          return;
        }

        if (verify.isSuccess) {
          await this.orderStatusService.transition(tx, order.id, OrderStatus.PAID);
          await tx.payment.create({
            data: {
              idempotencyKey,
              orderId: order.id,
              amount: order.total,
              method: verify.method, // Lưu đúng PaymentMethod.CARD hoặc PaymentMethod.WALLET
              status: PaymentStatus.SUCCEEDED,
              requestHash,
              cardLast4: query['vnp_BankCode'] ? String(query['vnp_BankCode']).slice(-4) : null,
            },
          });
        } else {
          await this.orderStatusService.transition(tx, order.id, OrderStatus.PAYMENT_FAILED);
          const failureReason =
            verify.responseCode === '24'
              ? 'Khách hàng hủy giao dịch trên cổng VNPay'
              : `Giao dịch thất bại (Mã lỗi VNPay: ${verify.responseCode})`;

          await tx.payment.create({
            data: {
              idempotencyKey,
              orderId: order.id,
              amount: order.total,
              method: verify.method,
              status: PaymentStatus.FAILED,
              failureReason,
              requestHash,
            },
          });
        }
      });
      return { RspCode: '00', Message: 'success' };
    } catch {
      return { RspCode: '99', Message: 'Unknown error' };
    }
  }

  /**
   * 3. Return URL Verify: Frontend gọi để kiểm tra kết quả và tự động đồng bộ trạng thái khi dev ở localhost
   * @route GET /payments/vnpay/return
   */
  @Get('vnpay/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xác thực kết quả thanh toán cho màn hình Return URL',
    description:
      'Vừa xác thực chữ ký vừa kích hoạt đồng bộ trạng thái đơn sang PAID khi dev trên môi trường localhost',
  })
  async verifyVnpayReturn(@Query() query: Record<string, any>) {
    // Tự động kích hoạt hàm IPN để cập nhật trạng thái đơn hàng ngay khi khách được chuyển về
    const ipnResult = await this.handleVnpayIpn(query);
    const verify = this.vnpayService.verifyCallback(query);

    return {
      isValid: verify.isValid,
      isSuccess: verify.isSuccess,
      orderId: verify.orderId,
      method: verify.method,
      responseCode: verify.responseCode,
      rspCode: ipnResult.RspCode,
    };
  }
}
