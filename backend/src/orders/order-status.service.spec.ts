import { ConflictException, NotFoundException } from '@nestjs/common';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { OrderStatusService } from './order-status.service';

describe('OrderStatusService (Sub-task 10.1b)', () => {
  let service: OrderStatusService;
  let mockTx: jest.Mocked<Prisma.TransactionClient>;

  const baseOrder: Order = {
    id: 1001,
    userId: 1,
    status: OrderStatus.PENDING,
    total: 70000,
    subtotal: 70000,
    discount: 0,
    promoCode: null,
    pointsEarned: 0,
    idempotencyKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = new OrderStatusService();

    mockTx = {
      $queryRaw: jest.fn(),
      order: {
        update: jest.fn(),
      },
    } as unknown as jest.Mocked<Prisma.TransactionClient>;
  });

  it('Thành công chuyển trạng thái PENDING -> PAID và gọi tx.order.update', async () => {
    (mockTx.$queryRaw as jest.Mock).mockResolvedValueOnce([
      {
        id: 1001,
        status: OrderStatus.PENDING,
        userId: 1,
        total: 70000,
      },
    ]);

    const updatedOrder: Order = {
      ...baseOrder,
      status: OrderStatus.PAID,
    };
    (mockTx.order.update as jest.Mock).mockResolvedValueOnce(updatedOrder);

    const onPaidHook = jest.fn().mockResolvedValue(undefined);
    service.registerHooks({ onPaid: onPaidHook });

    const result = await service.transition(mockTx, 1001, OrderStatus.PAID);

    expect(result.status).toBe(OrderStatus.PAID);
    expect(mockTx.$queryRaw).toHaveBeenCalled();
    expect(mockTx.order.update).toHaveBeenCalledWith({
      where: { id: 1001 },
      data: { status: OrderStatus.PAID },
    });
    expect(onPaidHook).toHaveBeenCalledWith(mockTx, updatedOrder);
  });

  it('Thành công chuyển trạng thái PAID -> CANCELLED và kích hoạt onCancelled hook', async () => {
    (mockTx.$queryRaw as jest.Mock).mockResolvedValueOnce([
      {
        id: 1001,
        status: OrderStatus.PAID,
        userId: 1,
        total: 70000,
      },
    ]);

    const updatedOrder: Order = {
      ...baseOrder,
      status: OrderStatus.CANCELLED,
    };
    (mockTx.order.update as jest.Mock).mockResolvedValueOnce(updatedOrder);

    const onCancelledHook = jest.fn().mockResolvedValue(undefined);
    service.registerHooks({ onCancelled: onCancelledHook });

    const result = await service.transition(mockTx, 1001, OrderStatus.CANCELLED, {
      reason: 'Khách yêu cầu hủy đơn trước khi pha chế',
    });

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(onCancelledHook).toHaveBeenCalledWith(
      mockTx,
      updatedOrder,
      'Khách yêu cầu hủy đơn trước khi pha chế',
    );
  });

  it('Ném NotFoundException khi đơn hàng không tồn tại trong database', async () => {
    (mockTx.$queryRaw as jest.Mock).mockResolvedValueOnce([]);

    await expect(service.transition(mockTx, 9999, OrderStatus.PAID)).rejects.toThrow(
      NotFoundException,
    );

    expect(mockTx.order.update).not.toHaveBeenCalled();
  });

  it('Ném ConflictException (409 INVALID_TRANSITION) khi chuyển trạng thái sai quy tắc (PENDING -> READY)', async () => {
    (mockTx.$queryRaw as jest.Mock).mockResolvedValueOnce([
      {
        id: 1001,
        status: OrderStatus.PENDING,
        userId: 1,
        total: 70000,
      },
    ]);

    await expect(service.transition(mockTx, 1001, OrderStatus.READY)).rejects.toThrow(
      ConflictException,
    );

    expect(mockTx.order.update).not.toHaveBeenCalled();
  });
});
