import { DiscountType, Prisma } from '@prisma/client';
import { LoyaltyService } from '../../src/loyalty/loyalty.service';
import { OrderStatusService } from '../../src/orders/order-status.service';
import { OrdersService } from '../../src/orders/orders.service';
import { PricingService } from '../../src/pricing/pricing.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PromotionsService } from '../../src/promotions/promotions.service';
import { findProductsByIds, validOrderBody } from '../orders/order-fixtures';

/**
 * Test (b) của Task 10 — Kiểm chứng tính idempotent của việc TẠO ĐƠN.
 *
 * (1) 2 request cùng Idempotency-Key → chỉ 1 đơn trong DB, response giống nhau, 1 lần 201.
 * (2) Chạy song song thật (Promise.all) → unique (userId, idempotencyKey) chặn tạo trùng.
 * (3) Điểm thưởng: dí đơn vào PAID nhiều lần (mô phỏng retry/đua idempotency thanh toán)
 *     → user chỉ được cộng điểm đúng 1 lần.
 * (4) Mã giảm giá chỉ bị trừ 1 lượt khi cùng key được gửi lặp lại.
 */

type Row = Record<string, unknown>;

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError(`Lỗi giả lập ${code}`, {
    code,
    clientVersion: 'test',
  });
}

/** Prisma tối giản: unique (userId, idempotencyKey), commit sau transaction, promotion in-memory. */
function createPrismaForIdempotency(promotions: Row[] = []) {
  const db = {
    orders: [] as Row[],
    orderItems: [] as Row[],
    promotions: promotions.map((p) => ({ ...p })),
    users: [{ id: 7, loyaltyPoints: 0 }] as Array<{ id: number; loyaltyPoints: number }>,
  };
  let nextOrderId = 1001;

  const findOrderByKey = (userId: number, key: string) => {
    const hit = db.orders.find((o) => o.userId === userId && o.idempotencyKey === key);
    if (!hit) return null;
    return {
      ...hit,
      items: db.orderItems.filter((i) => i.orderId === hit.id).map((i) => ({ ...i })),
    };
  };

  const prisma = {
    product: { findMany: jest.fn(findProductsByIds) },
    order: {
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: { userId_idempotencyKey: { userId: number; idempotencyKey: string } };
        }) =>
          Promise.resolve(
            findOrderByKey(
              where.userId_idempotencyKey.userId,
              where.userId_idempotencyKey.idempotencyKey,
            ),
          ),
      ),
    },
    promotion: {
      findUnique: jest.fn(({ where }: { where: { code: string } }) =>
        Promise.resolve(db.promotions.find((p) => p.code === where.code) ?? null),
      ),
    },
    $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      const staged = { orders: [] as Row[], orderItems: [] as Row[] };

      const tx = {
        order: {
          create: jest.fn(
            ({ data }: { data: Row }) =>
              new Promise((resolve, reject) => {
                setTimeout(() => {
                  if (
                    data.idempotencyKey &&
                    findOrderByKey(data.userId as number, data.idempotencyKey as string)
                  ) {
                    reject(prismaError('P2002'));
                    return;
                  }
                  const row = {
                    id: nextOrderId++,
                    createdAt: new Date('2026-11-03T09:00:00Z'),
                    // Giá trị mặc định của DB (@default)
                    pointsEarned: 0,
                    ...data,
                  };
                  staged.orders.push(row);
                  resolve(row);
                }, 5);
              }),
          ),
          updateMany: jest.fn(
            ({
              where,
              data,
            }: {
              where: { id: number; pointsEarned?: number | { gt: number } };
              data: Row;
            }) => {
              const order = db.orders.find((o) => o.id === where.id);
              if (!order) return Promise.resolve({ count: 0 });
              const condition = where.pointsEarned;
              const matches =
                condition === undefined ||
                (typeof condition === 'number'
                  ? order.pointsEarned === condition
                  : (order.pointsEarned as number) > condition.gt);
              if (!matches) return Promise.resolve({ count: 0 });
              Object.assign(order, data);
              return Promise.resolve({ count: 1 });
            },
          ),
        },
        orderItem: {
          create: jest.fn(({ data }: { data: Row }) => {
            staged.orderItems.push(data);
            return Promise.resolve(data);
          }),
        },
        user: {
          update: jest.fn(
            ({
              where,
              data,
            }: {
              where: { id: number };
              data: { loyaltyPoints: { increment?: number; decrement?: number } };
            }) => {
              const user = db.users.find((u) => u.id === where.id);
              if (!user) throw new Error('User không tồn tại');
              if (data.loyaltyPoints.increment != null)
                user.loyaltyPoints += data.loyaltyPoints.increment;
              if (data.loyaltyPoints.decrement != null)
                user.loyaltyPoints -= data.loyaltyPoints.decrement;
              return Promise.resolve(user);
            },
          ),
        },
        promotion: {
          findUnique: jest.fn(({ where }: { where: { code: string } }) =>
            Promise.resolve(db.promotions.find((p) => p.code === where.code) ?? null),
          ),
          update: jest.fn(
            ({
              where,
              data,
            }: {
              where: { code: string };
              data: { usedCount: { increment?: number; decrement?: number } };
            }) => {
              const promo = db.promotions.find((p) => p.code === where.code);
              if (!promo) throw new Error('Promotion không tồn tại');
              if (data.usedCount.increment != null)
                promo.usedCount = (promo.usedCount as number) + data.usedCount.increment;
              if (data.usedCount.decrement != null)
                promo.usedCount = (promo.usedCount as number) - data.usedCount.decrement;
              return Promise.resolve(promo);
            },
          ),
          updateMany: jest.fn(
            ({
              where,
              data,
            }: {
              where: { code: string; usedCount?: { lt: number } };
              data: { usedCount: { increment: number } };
            }) => {
              const promo = db.promotions.find((p) => p.code === where.code);
              if (!promo) return Promise.resolve({ count: 0 });
              if (where.usedCount && !((promo.usedCount as number) < where.usedCount.lt)) {
                return Promise.resolve({ count: 0 });
              }
              promo.usedCount = (promo.usedCount as number) + data.usedCount.increment;
              return Promise.resolve({ count: 1 });
            },
          ),
        },
      };

      const result = await callback(tx);
      db.orders.push(...staged.orders);
      db.orderItems.push(...staged.orderItems);
      return result;
    }),
  };

  return { prisma, db };
}

function promoRow(overrides: Row = {}) {
  return {
    id: 1,
    code: 'BREW10',
    type: DiscountType.PERCENT,
    value: 10,
    minOrder: 0,
    maxDiscount: 20000,
    startsAt: new Date('2026-10-01T00:00:00Z'),
    endsAt: new Date('2026-12-31T00:00:00Z'),
    usageLimit: null,
    usedCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildService(promotions: Row[] = []) {
  const fake = createPrismaForIdempotency(promotions);
  const prisma = fake.prisma as unknown as PrismaService;
  const orderStatusService = {
    transition: jest.fn().mockResolvedValue(undefined),
  } as unknown as OrderStatusService;
  const service = new OrdersService(
    prisma,
    new PricingService(prisma),
    new PromotionsService(prisma),
    orderStatusService,
  );
  return { ...fake, service };
}

describe('Task 10 test (b) — Idempotency tạo đơn (Sub-task 10.2c)', () => {
  describe('cùng Idempotency-Key', () => {
    it('gửi 2 lần tuần tự cùng key → 1 đơn, 1 lần tạo mới, 1 lần replayed, response giống nhau', async () => {
      const { service, db, prisma } = buildService();

      const first = await service.create(7, validOrderBody as never, {
        idempotencyKey: 'order-key-1',
      });
      const second = await service.create(7, validOrderBody as never, {
        idempotencyKey: 'order-key-1',
      });

      expect(first.replayed).toBe(false);
      expect(second.replayed).toBe(true);
      expect(second.orderId).toBe(first.orderId);
      expect(second.code).toBe(first.code);
      expect(second.total).toBe(first.total);
      expect(second.items).toEqual(first.items);

      expect(db.orders).toHaveLength(1);
      // Chỉ 1 lần vào transaction (lần 2 trả lại ngay từ fast path)
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('2 request SONG SONG cùng key → chỉ 1 đơn trong DB, không lỗi 500', async () => {
      const { service, db } = buildService();

      const [a, b] = await Promise.all([
        service.create(7, validOrderBody as never, { idempotencyKey: 'parallel-key' }),
        service.create(7, validOrderBody as never, { idempotencyKey: 'parallel-key' }),
      ]);

      expect(db.orders).toHaveLength(1);
      expect(a.orderId).toBe(b.orderId);
      // Đúng 1 request là "tạo mới", request còn lại là "replayed"
      expect([a.replayed, b.replayed].sort()).toEqual([false, true]);
    });

    it('cùng key + mã giảm giá → mã chỉ bị trừ 1 lượt', async () => {
      const { service, db } = buildService([promoRow({ usageLimit: 5 })]);

      const body = { ...validOrderBody, promoCode: 'BREW10' };
      await service.create(7, body as never, { idempotencyKey: 'promo-key' });
      await service.create(7, body as never, { idempotencyKey: 'promo-key' });

      expect(db.promotions[0].usedCount).toBe(1);
      expect(db.orders).toHaveLength(1);
    });

    it('cùng key nhưng payload khác vẫn KHÔNG tạo đơn thứ hai (khóa là key)', async () => {
      const { service, db } = buildService();

      const first = await service.create(7, validOrderBody as never, {
        idempotencyKey: 'same-key',
      });
      const second = await service.create(
        7,
        { items: [{ productId: 5, size: 'S', qty: 3 }] } as never,
        { idempotencyKey: 'same-key' },
      );

      expect(second.orderId).toBe(first.orderId);
      expect(second.replayed).toBe(true);
      expect(db.orders).toHaveLength(1);
    });

    it('khác key → tạo 2 đơn độc lập', async () => {
      const { service, db } = buildService();

      const a = await service.create(7, validOrderBody as never, { idempotencyKey: 'k-1' });
      const b = await service.create(7, validOrderBody as never, { idempotencyKey: 'k-2' });

      expect(a.orderId).not.toBe(b.orderId);
      expect(db.orders).toHaveLength(2);
    });
  });

  describe('điểm thưởng chỉ cộng 1 lần (đua idempotency thanh toán)', () => {
    it('dí đơn vào PAID nhiều lần → user chỉ nhận điểm đúng 1 lần', async () => {
      const { service, db, prisma } = buildService();
      const loyalty = new LoyaltyService(prisma as unknown as never);

      const order = await service.create(7, validOrderBody as never, {
        idempotencyKey: 'loyalty-key',
      });
      const orderRow = db.orders.find((o) => o.id === order.orderId)!;

      // Mỗi lần "thanh toán thành công" là một transaction riêng, đơn được đọc lại từ DB
      const awardOnce = () =>
        prisma.$transaction(async (tx: unknown) =>
          loyalty.award(tx as never, {
            id: orderRow.id as number,
            userId: orderRow.userId as number,
            total: orderRow.total as number,
            pointsEarned: orderRow.pointsEarned as number,
          }),
        );

      // Mô phỏng 3 lần dí đơn vào PAID (retry / request đua cùng key)
      const awards = [await awardOnce(), await awardOnce(), await awardOnce()];

      expect(awards).toEqual([17, 0, 0]); // floor(178.000 / 10.000) = 17
      expect(db.users[0].loyaltyPoints).toBe(17);
    });

    it('đơn có mã giảm giá: điểm tính trên total sau giảm (160.200đ → 16 điểm)', async () => {
      const { service, db, prisma } = buildService([promoRow()]);
      const loyalty = new LoyaltyService(prisma as unknown as never);

      const order = await service.create(7, { ...validOrderBody, promoCode: 'BREW10' } as never, {
        idempotencyKey: 'loyalty-promo',
      });
      const orderRow = db.orders.find((o) => o.id === order.orderId)!;

      await prisma.$transaction(async (tx: unknown) => {
        await loyalty.award(tx as never, {
          id: orderRow.id as number,
          userId: orderRow.userId as number,
          total: orderRow.total as number,
          pointsEarned: orderRow.pointsEarned as number,
        });
      });
      // Gọi lặp lại (ví dụ retry) trong transaction khác
      await prisma.$transaction(async (tx: unknown) => {
        await loyalty.award(tx as never, {
          id: orderRow.id as number,
          userId: orderRow.userId as number,
          total: orderRow.total as number,
          pointsEarned: orderRow.pointsEarned as number,
        });
      });

      expect(order.total).toBe(160200);
      expect(db.users[0].loyaltyPoints).toBe(16);
    });
  });
});
