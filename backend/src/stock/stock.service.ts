import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface ReserveItem {
  productId: number;
  qty: number;
}

/**
 * Quản lý tồn kho đơn hàng (Sub-task 10.3).
 *
 * reserve()  — giữ kho khi TẠO đơn, dùng optimistic locking với retry (tối đa 3 lần).
 * release()  — hoàn kho khi đơn bị HỦY; chỉ gọi từ StockHooksService.onCancelled.
 *
 * Thuật toán reserve cho mỗi productId:
 *   1. Đọc (stock, version) hiện tại.
 *   2. Nếu stock < qty → 409 OUT_OF_STOCK ngay.
 *   3. updateMany WHERE id=X AND version=V AND stock >= qty
 *      SET stock -= qty, version += 1
 *   4. Nếu count=0 → đọc lại:
 *        stock < qty  → 409 OUT_OF_STOCK
 *        ngược lại    → xung đột phiên bản, thử lại (tối đa 3 lần).
 */
@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);
  private static readonly MAX_RETRIES = 3;

  /**
   * Giữ tồn kho cho các dòng trong đơn hàng.
   * Phải chạy trong cùng transaction với OrdersService.create (Sub-task 10.3b).
   */
  async reserve(tx: Prisma.TransactionClient, items: ReserveItem[]): Promise<void> {
    const qtyMap = new Map<number, number>();
    for (const item of items) {
      qtyMap.set(item.productId, (qtyMap.get(item.productId) ?? 0) + item.qty);
    }
    for (const [productId, qty] of qtyMap) {
      await this.reserveOne(tx, productId, qty, 1);
    }
  }

  private async reserveOne(
    tx: Prisma.TransactionClient,
    productId: number,
    qty: number,
    attempt: number,
  ): Promise<void> {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { stock: true, version: true },
    });

    if (!product || product.stock < qty) {
      throw new ConflictException({ code: 'OUT_OF_STOCK', productId });
    }

    const { count } = await tx.product.updateMany({
      where: {
        id: productId,
        version: product.version,
        stock: { gte: qty },
      },
      data: {
        stock: { decrement: qty },
        version: { increment: 1 },
      },
    });

    if (count === 0) {
      const current = await tx.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });

      if (!current || current.stock < qty) {
        throw new ConflictException({ code: 'OUT_OF_STOCK', productId });
      }

      if (attempt >= StockService.MAX_RETRIES) {
        this.logger.warn(`Sản phẩm #${productId}: đã thử ${attempt} lần, vẫn xung đột phiên bản`);
        throw new ConflictException({ code: 'OUT_OF_STOCK', productId });
      }

      this.logger.warn(`Sản phẩm #${productId}: xung đột phiên bản, thử lại lần ${attempt + 1}`);
      return this.reserveOne(tx, productId, qty, attempt + 1);
    }
  }

  /**
   * Hoàn tồn kho khi đơn bị hủy (Sub-task 10.3b).
   * Gọi từ StockHooksService trong cùng transaction của OrderStatusService.transition.
   */
  async release(tx: Prisma.TransactionClient, orderId: number): Promise<void> {
    const orderItems = await tx.orderItem.findMany({
      where: { orderId },
      select: { productId: true, qty: true },
    });

    if (orderItems.length === 0) return;

    const qtyMap = new Map<number, number>();
    for (const item of orderItems) {
      qtyMap.set(item.productId, (qtyMap.get(item.productId) ?? 0) + item.qty);
    }

    for (const [productId, qty] of qtyMap) {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: qty }, version: { increment: 1 } },
      });
    }

    this.logger.log(`Đơn #${orderId}: hoàn kho ${qtyMap.size} sản phẩm`);
  }
}
