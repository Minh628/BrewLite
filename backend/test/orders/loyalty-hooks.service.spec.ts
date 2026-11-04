import { Order, OrderStatus } from '@prisma/client';
import { LoyaltyHooksService } from '../../src/orders/loyalty-hooks.service';
import { OrderStatusService } from '../../src/orders/order-status.service';
import { LoyaltyService } from '../../src/loyalty/loyalty.service';

/**
 * Nối LoyaltyService vào State Machine (Sub-task 10.4c, Mục 6.1):
 * - PAID      → cộng điểm đúng 1 lần
 * - CANCELLED → thu hồi đúng số điểm đã cộng
 */
function createOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 1001,
    userId: 7,
    status: OrderStatus.PAID,
    total: 160_200,
    subtotal: 178_000,
    discount: 17_800,
    promoCode: 'BREW10',
    pointsEarned: 0,
    idempotencyKey: null,
    createdAt: new Date('2026-11-02T10:00:00Z'),
    updatedAt: new Date('2026-11-02T10:00:00Z'),
    ...overrides,
  } as Order;
}

describe('LoyaltyHooksService (Sub-task 10.4c — nối vào State Machine)', () => {
  let orderStatusService: OrderStatusService;
  let loyaltyService: LoyaltyService;
  let hooks: LoyaltyHooksService;

  beforeEach(() => {
    orderStatusService = new OrderStatusService();
    loyaltyService = { award: jest.fn(), revoke: jest.fn() } as unknown as LoyaltyService;
    hooks = new LoyaltyHooksService(orderStatusService, loyaltyService);
    hooks.onModuleInit();
  });

  it('đăng ký hook onPaid và onCancelled khi khởi tạo module', async () => {
    const paid = jest.fn(() => Promise.resolve(16));
    const cancelled = jest.fn(() => Promise.resolve(0));
    loyaltyService.award = paid;
    loyaltyService.revoke = cancelled;

    const order = createOrder();
    const registered = (
      orderStatusService as unknown as {
        hooks: {
          onPaid?: (tx: never, o: Order) => Promise<void>;
          onCancelled?: (tx: never, o: Order) => Promise<void>;
        };
      }
    ).hooks;

    await registered.onPaid!(undefined as never, order);
    await registered.onCancelled!(undefined as never, order);

    expect(paid).toHaveBeenCalledWith(undefined, {
      id: 1001,
      userId: 7,
      total: 160_200,
      pointsEarned: 0,
    });
    expect(cancelled).toHaveBeenCalledWith(undefined, {
      id: 1001,
      userId: 7,
      total: 160_200,
      pointsEarned: 0,
    });
  });

  it('đơn vào PAID gọi award với total sau giảm giá (160.200đ → 16 điểm)', async () => {
    (loyaltyService.award as jest.Mock).mockResolvedValue(16);

    const order = createOrder();
    await orderStatusService['handlePaidHook'](undefined as never, order);

    expect(loyaltyService.award).toHaveBeenCalledWith(undefined, {
      id: 1001,
      userId: 7,
      total: 160_200,
      pointsEarned: 0,
    });
  });

  it('đơn bị CANCELLED gọi revoke với số điểm đã cộng', async () => {
    (loyaltyService.revoke as jest.Mock).mockResolvedValue(16);

    const order = createOrder({ status: OrderStatus.COMPLETED, pointsEarned: 16 });
    await orderStatusService['handleCancelledHook'](undefined as never, order, 'Khách đổi ý');

    expect(loyaltyService.revoke).toHaveBeenCalledWith(undefined, {
      id: 1001,
      userId: 7,
      total: 160_200,
      pointsEarned: 16,
    });
  });

  it('lỗi trong hook lan ra ngoài để transaction rollback (không nuốt lỗi)', async () => {
    (loyaltyService.award as jest.Mock).mockRejectedValue(new Error('DB lỗi'));

    await expect(
      orderStatusService['handlePaidHook'](undefined as never, createOrder()),
    ).rejects.toThrow('DB lỗi');
  });
});
