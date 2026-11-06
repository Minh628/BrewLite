import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { BEARER_AUTH } from '../swagger';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { SimulatePaymentDto, SimulatePaymentResponseDto } from './dto/simulate-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
}
