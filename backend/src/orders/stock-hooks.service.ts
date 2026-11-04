import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Order, Prisma } from '@prisma/client';
import { StockService } from '../stock/stock.service';
import { OrderStatusService } from './order-status.service';

/**
 * Nối StockService vào State Machine đơn hàng (Sub-task 10.3b).
 *
 * - Vào CANCELLED → hoàn kho (StockService.release).
 *
 * Chạy trong CÙNG transaction của OrderStatusService.transition.
 */
@Injectable()
export class StockHooksService implements OnModuleInit {
  private readonly logger = new Logger(StockHooksService.name);

  constructor(
    private readonly orderStatusService: OrderStatusService,
    private readonly stockService: StockService,
  ) {}

  onModuleInit(): void {
    this.orderStatusService.registerHooks({
      onCancelled: (tx, order) => this.onCancelled(tx, order),
    });
  }

  private async onCancelled(tx: Prisma.TransactionClient, order: Order): Promise<void> {
    await this.stockService.release(tx, order.id);
    this.logger.log(`Đơn #${order.id} bị hủy: đã hoàn kho`);
  }
}
