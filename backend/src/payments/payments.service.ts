import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { OrderStatusService } from '../orders/order-status.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { MockPaymentGateway } from './mock-payment.gateway';

type LockedOrder = {
  id: number;
  userId: number;
  status: OrderStatus;
  total: number;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MockPaymentGateway,
    private readonly orderStatusService: OrderStatusService,
  ) {}

  async create(
    userId: number,
    dto: CreatePaymentDto,
    idempotencyKey?: string,
  ): Promise<{ payment: PaymentResponseDto; replayed: boolean }> {
    const key = idempotencyKey?.trim();
    if (!key) {
      throw new BadRequestException({
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key là bắt buộc',
      });
    }
    if (dto.method === PaymentMethod.CARD && !dto.cardNumber) {
      throw new BadRequestException('Số thẻ là bắt buộc khi thanh toán bằng thẻ');
    }
    if (dto.method === PaymentMethod.WALLET && dto.cardNumber) {
      throw new BadRequestException('Không gửi số thẻ khi thanh toán bằng ví');
    }

    const cardLast4 = dto.cardNumber?.replace(/\s/g, '').slice(-4) ?? null;
    const requestHash = createHash('sha256')
      .update(`${userId}|${dto.orderId}|${dto.method}|${cardLast4 ?? ''}`)
      .digest('hex');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<LockedOrder[]>`
          SELECT id, "userId", status, total
          FROM "Order"
          WHERE id = ${dto.orderId} AND "userId" = ${userId}
          FOR UPDATE
        `;
        const order = rows[0];
        if (!order) {
          throw new NotFoundException('Không tìm thấy đơn hàng');
        }

        const existing = await tx.payment.findUnique({ where: { idempotencyKey: key } });
        if (existing) {
          if (existing.requestHash !== requestHash) {
            throw new UnprocessableEntityException({
              code: 'IDEMPOTENCY_KEY_REUSED',
              message: 'Idempotency-Key đã được dùng với nội dung thanh toán khác',
            });
          }
          return { payment: this.toResponse(existing), replayed: true };
        }

        if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAYMENT_FAILED) {
          throw new ConflictException({
            code: 'ORDER_NOT_PAYABLE',
            message: 'Đơn hàng không ở trạng thái có thể thanh toán',
            currentStatus: order.status,
          });
        }

        const result = await this.gateway.charge({
          method: dto.method,
          cardNumber: dto.cardNumber,
        });
        const status = result.succeeded ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED;
        const payment = await tx.payment.create({
          data: {
            idempotencyKey: key,
            orderId: order.id,
            amount: order.total,
            method: dto.method,
            status,
            requestHash,
            cardLast4,
            failureReason: result.failureReason ?? null,
          },
        });

        await this.orderStatusService.transition(
          tx,
          order.id,
          result.succeeded ? OrderStatus.PAID : OrderStatus.PAYMENT_FAILED,
        );

        return { payment: this.toResponse(payment), replayed: false };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey: key } });
        if (existing) {
          if (existing.requestHash !== requestHash) {
            throw new UnprocessableEntityException({
              code: 'IDEMPOTENCY_KEY_REUSED',
              message: 'Idempotency-Key đã được dùng với nội dung thanh toán khác',
            });
          }
          return { payment: this.toResponse(existing), replayed: true };
        }
      }
      throw error;
    }
  }

  /**
   * API mô phỏng webhook/cổng thanh toán bên thứ ba (VNPay/Mock) cập nhật trạng thái đơn (PAID hoặc PAYMENT_FAILED).
   * Phục vụ kiểm thử Swagger linh hoạt theo yêu cầu.
   */
  async simulate(dto: { orderId: number; status: 'PAID' | 'PAYMENT_FAILED' }) {
    const toStatus = dto.status === 'PAID' ? OrderStatus.PAID : OrderStatus.PAYMENT_FAILED;

    return await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<LockedOrder[]>`
        SELECT id, "userId", status, total
        FROM "Order"
        WHERE id = ${dto.orderId}
        FOR UPDATE
      `;
      const order = rows[0];
      if (!order) {
        throw new NotFoundException(`Không tìm thấy đơn hàng #${dto.orderId}`);
      }

      // Kiểm tra trạng thái hiện tại theo đúng sơ đồ State Machine
      if (toStatus === OrderStatus.PAID) {
        if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAYMENT_FAILED) {
          throw new ConflictException({
            code: 'ORDER_NOT_PAYABLE',
            message: `Không thể chuyển sang PAID từ trạng thái ${order.status}`,
            currentStatus: order.status,
          });
        }
      } else if (toStatus === OrderStatus.PAYMENT_FAILED) {
        if (order.status !== OrderStatus.PENDING) {
          throw new ConflictException({
            code: 'INVALID_TRANSITION',
            message: `Không thể chuyển sang PAYMENT_FAILED từ trạng thái ${order.status}`,
            currentStatus: order.status,
          });
        }
      }

      // Chuyển trạng thái qua OrderStatusService để kích hoạt hooks (loyalty tích điểm khi PAID)
      const updatedOrder = await this.orderStatusService.transition(tx, order.id, toStatus);

      // Ghi nhận bản ghi thanh toán mô phỏng
      await tx.payment.create({
        data: {
          idempotencyKey: `simulate-${order.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          orderId: order.id,
          amount: order.total,
          method: PaymentMethod.CARD,
          status: toStatus === OrderStatus.PAID ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
          requestHash: `sim-hash-${order.id}-${Date.now()}`,
          cardLast4: '4242',
          failureReason:
            toStatus === OrderStatus.PAYMENT_FAILED ? 'Mô phỏng thanh toán thất bại' : null,
        },
      });

      return {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        message: `Đã cập nhật trạng thái đơn #${order.id} sang ${updatedOrder.status} thành công`,
      };
    });
  }

  private toResponse(payment: {
    orderId: number;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    cardLast4: string | null;
    failureReason: string | null;
  }): PaymentResponseDto {
    return {
      orderId: payment.orderId,
      amount: payment.amount,
      // Kiểu method đã được đảm bảo bởi enum PaymentMethod từ tầng Prisma Schema
      method: payment.method,
      status:
        payment.status === PaymentStatus.SUCCEEDED ? OrderStatus.PAID : OrderStatus.PAYMENT_FAILED,
      cardLast4: payment.cardLast4,
      failureReason: payment.failureReason,
    };
  }
}
