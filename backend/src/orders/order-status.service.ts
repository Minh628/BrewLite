import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { assertTransition } from './order-state-machine';

export interface TransitionOptions {
  reason?: string;
}

/**
 * Interface cho các tác vụ đi kèm (Hooks) khi chuyển đổi trạng thái đơn hàng.
 * Sẵn sàng kết nối với LoyaltyService (M4) và StockService (M1).
 */
export interface OrderStatusHooks {
  onPaid?(tx: Prisma.TransactionClient, order: Order): Promise<void>;
  onCancelled?(tx: Prisma.TransactionClient, order: Order, reason?: string): Promise<void>;
}

@Injectable()
export class OrderStatusService {
  private readonly logger = new Logger(OrderStatusService.name);

  // Hook registry cho phép các service khác (Loyalty, Stock) tích hợp logic nghiệp vụ
  private hooks: OrderStatusHooks = {};

  /**
   * Đăng ký hook nghiệp vụ đi kèm khi chuyển trạng thái
   */
  registerHooks(hooks: OrderStatusHooks): void {
    this.hooks = { ...this.hooks, ...hooks };
  }

  /**
   * Nơi DUY NHẤT trong toàn bộ hệ thống được phép cập nhật Order.status (Mục 6.1 & 10.1b).
   * Các bước xử lý:
   * 1. Thực hiện khóa dòng bản ghi Order (SELECT ... FOR UPDATE) trong transaction để chống race condition.
   * 2. Kiểm tra tính hợp lệ qua assertTransition.
   * 3. Cập nhật trạng thái mới.
   * 4. Kích hoạt các side-effects / hooks (PAID: cộng điểm; CANCELLED: hoàn kho, hủy điểm).
   *
   * @param tx Prisma Transaction Client bắt buộc để đảm bảo tính nguyên tử
   * @param orderId ID đơn hàng cần chuyển trạng thái
   * @param toStatus Trạng thái đích muốn chuyển sang
   * @param options Các tùy chọn bổ sung (ví dụ: lý do hủy)
   * @returns Đơn hàng sau khi đã cập nhật trạng thái mới
   */
  async transition(
    tx: Prisma.TransactionClient,
    orderId: number,
    toStatus: OrderStatus,
    options?: TransitionOptions,
  ): Promise<Order> {
    // 1. Thực hiện khóa dòng đơn hàng để tránh race condition (Mục 10.1b)
    const rows = await tx.$queryRaw<
      Array<{ id: number; status: OrderStatus; userId: number; total: number }>
    >`SELECT id, status, "userId", total FROM "Order" WHERE id = ${orderId} FOR UPDATE`;

    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${orderId}`);
    }

    const currentOrder = rows[0];

    // 2. Kiểm tra tính hợp lệ của cặp chuyển đổi trạng thái
    assertTransition(currentOrder.status, toStatus);

    // 3. Cập nhật trạng thái mới vào cơ sở dữ liệu
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: toStatus },
    });

    this.logger.log(
      `Đơn hàng #${orderId} chuyển trạng thái thành công: ${currentOrder.status} -> ${toStatus}`,
    );

    // 4. Kích hoạt các tác vụ đi kèm (Hooks) trong cùng transaction
    if (toStatus === OrderStatus.PAID) {
      await this.handlePaidHook(tx, updatedOrder);
    } else if (toStatus === OrderStatus.CANCELLED) {
      await this.handleCancelledHook(tx, updatedOrder, options?.reason);
    }

    return updatedOrder;
  }

  /**
   * Xử lý tác vụ khi đơn chuyển sang PAID (Mục 6.1):
   * Ghi log và gọi LoyaltyService.award (nếu có hook đăng ký)
   */
  private async handlePaidHook(tx: Prisma.TransactionClient, order: Order): Promise<void> {
    this.logger.log(
      `Kích hoạt hook PAID cho đơn #${order.id}: Chuẩn bị tích lũy loyalty points cho User #${order.userId}`,
    );
    if (this.hooks.onPaid) {
      await this.hooks.onPaid(tx, order);
    }
  }

  /**
   * Xử lý tác vụ khi đơn chuyển sang CANCELLED (Mục 6.1):
   * Ghi log và gọi StockService.release + LoyaltyService.revoke (nếu có hook đăng ký)
   */
  private async handleCancelledHook(
    tx: Prisma.TransactionClient,
    order: Order,
    reason?: string,
  ): Promise<void> {
    this.logger.warn(
      `Kích hoạt hook CANCELLED cho đơn #${order.id}: Hoàn tồn kho và thu hồi loyalty points. Lý do: ${reason ?? 'Không nêu'}`,
    );
    if (this.hooks.onCancelled) {
      await this.hooks.onCancelled(tx, order, reason);
    }
  }
}
