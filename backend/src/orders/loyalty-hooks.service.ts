import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Order, Prisma } from '@prisma/client';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { OrderStatusService } from './order-status.service';

/**
 * Nối LoyaltyService vào State Machine đơn hàng (Mục 6.1, Sub-task 10.4c).
 *
 * - Vào PAID     → cộng điểm (LoyaltyService.award), an toàn khi gọi lặp.
 * - Vào CANCELLED → thu hồi điểm (LoyaltyService.revoke) nếu đơn đã từng cộng.
 * - Hoàn lượt mã giảm giá: do luồng hủy đơn (PB-25) gọi PromotionsService.releaseUsage.
 *
 * Toàn bộ chạy trong CÙNG transaction của OrderStatusService.transition để bảo đảm
 * "đổi trạng thái + cộng điểm" cùng thành công hoặc cùng rollback.
 */
@Injectable()
export class LoyaltyHooksService implements OnModuleInit {
  private readonly logger = new Logger(LoyaltyHooksService.name);

  constructor(
    private readonly orderStatusService: OrderStatusService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  onModuleInit(): void {
    this.orderStatusService.registerHooks({
      onPaid: (tx, order) => this.onPaid(tx, order),
      onCancelled: (tx, order) => this.onCancelled(tx, order),
    });
  }

  private async onPaid(tx: Prisma.TransactionClient, order: Order): Promise<void> {
    const points = await this.loyaltyService.award(tx, {
      id: order.id,
      userId: order.userId,
      total: order.total,
      pointsEarned: order.pointsEarned,
    });

    if (points > 0) {
      this.logger.log(`Đơn #${order.id} vào PAID: cộng ${points} điểm cho user #${order.userId}`);
    } else {
      this.logger.log(`Đơn #${order.id} vào PAID nhưng điểm đã được cộng trước đó, bỏ qua`);
    }
  }

  private async onCancelled(tx: Prisma.TransactionClient, order: Order): Promise<void> {
    const revoked = await this.loyaltyService.revoke(tx, {
      id: order.id,
      userId: order.userId,
      total: order.total,
      pointsEarned: order.pointsEarned,
    });

    if (revoked > 0) {
      this.logger.warn(
        `Đơn #${order.id} bị hủy: thu hồi ${revoked} điểm của user #${order.userId}`,
      );
    }
  }
}
