import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DiscountType, OrderStatus, Prisma, Role } from '@prisma/client';
import { CreateOrderDto } from '../../src/orders/dto/create-order.dto';
import { OrderStatusService } from '../../src/orders/order-status.service';
import { formatOrderCode, OrdersService } from '../../src/orders/orders.service';
import { PricingService } from '../../src/pricing/pricing.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PromotionsService } from '../../src/promotions/promotions.service';
import { PROMO_ERROR } from '../../src/promotions/promotion-rules';
import { StockService } from '../../src/stock/stock.service';
import { EXPECTED_TOTAL, findProductsByIds, validOrderBody } from './order-fixtures';

type Row = Record<string, unknown>;

/**
 * Prisma giả lập có transaction thật sự: ghi vào vùng tạm, chỉ commit khi callback thành công,
 * lỗi giữa chừng thì bỏ toàn bộ vùng tạm (rollback).
 * Đồng thời mô phỏng ràng buộc @@unique([userId, idempotencyKey]) và bảng Promotion.
 */
function createPrismaFake(promotions: Row[] = []) {
  const db = {
    orders: [] as Row[],
    orderItems: [] as Row[],
    promotions: promotions.map((p) => ({ ...p })),
  };
  let nextOrderId = 1001;
  let failOnOrderItem: unknown = null;

  const findOrderByKey = (userId: number, key: string | null | undefined) => {
    if (!key) return null;
    const hit = db.orders.find((o) => o.userId === userId && o.idempotencyKey === key);
    if (!hit) return null;
    return {
      ...hit,
      items: db.orderItems.filter((i) => i.orderId === hit.id).map((i) => ({ ...i })),
    };
  };

  const findPromotion = (code: string) => {
    const hit = db.promotions.find((p) => p.code === code);
    return hit ? { ...hit } : null;
  };

  const prisma = {
    product: { findMany: jest.fn(findProductsByIds) },
    order: {
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: {
            userId_idempotencyKey?: { userId: number; idempotencyKey: string };
            id?: number;
          };
        }) => {
          if (where.id != null) {
            const hit = db.orders.find((o) => o.id === where.id);
            return Promise.resolve(hit ? { ...hit } : null);
          }
          if (where.userId_idempotencyKey) {
            return Promise.resolve(
              findOrderByKey(
                where.userId_idempotencyKey.userId,
                where.userId_idempotencyKey.idempotencyKey,
              ),
            );
          }
          return Promise.resolve(null);
        },
      ),
    },
    promotion: {
      findUnique: jest.fn(({ where }: { where: { code: string } }) =>
        Promise.resolve(findPromotion(where.code)),
      ),
    },
    $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      const staged = { orders: [] as Row[], orderItems: [] as Row[] };
      // Promotion dùng trực tiếp dữ liệu đã commit để mô phỏng đọc-trước-khi-ghi của Postgres
      const txPromotions = db.promotions;

      const tx = {
        order: {
          create: jest.fn(({ data }: { data: Row }) => {
            if (
              data.idempotencyKey &&
              findOrderByKey(data.userId as number, data.idempotencyKey as string)
            ) {
              return Promise.reject(prismaError('P2002'));
            }
            // Đua thật sự: chờ 5ms để request song song kịp cùng tra thấy "chưa có đơn",
            // rồi một bên sẽ vi phạm unique (P2002) khi commit.
            return new Promise((resolve, reject) => {
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
                  createdAt: new Date('2026-10-24T10:00:00Z'),
                  ...data,
                };
                staged.orders.push(row);
                resolve(row);
              }, 5);
            });
          }),
        },
        orderItem: {
          create: jest.fn(({ data }: { data: Row }) => {
            if (failOnOrderItem) {
              return Promise.reject(failOnOrderItem);
            }
            staged.orderItems.push(data);
            return Promise.resolve(data);
          }),
        },
        promotion: {
          findUnique: jest.fn(({ where }: { where: { code: string } }) =>
            Promise.resolve(findPromotion(where.code)),
          ),
          update: jest.fn(
            ({
              where,
              data,
            }: {
              where: { code: string };
              data: { usedCount: { increment?: number; decrement?: number } };
            }) => {
              const promo = txPromotions.find((p) => p.code === where.code);
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
              const promo = txPromotions.find((p) => p.code === where.code);
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
      // Commit: ghi Order/OrderItem trước rồi mới đánh dấu "đã có đơn" cho request đua
      db.orders.push(...staged.orders);
      db.orderItems.push(...staged.orderItems);
      return result;
    }),
  };

  return {
    prisma,
    db,
    failOrderItemWith: (error: unknown) => {
      failOnOrderItem = error;
    },
  };
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError(`Lỗi giả lập ${code}`, {
    code,
    clientVersion: 'test',
  });
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

describe('OrdersService (PB-06 / Sub-task 6.3, 6.5)', () => {
  let fake: ReturnType<typeof createPrismaFake>;
  let service: OrdersService;

  function setup(promotions: Row[] = []) {
    fake = createPrismaFake(promotions);
    const prisma = fake.prisma as unknown as PrismaService;
    const stockService = {
      reserve: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    } as unknown as StockService;
    const orderStatusService = {
      transition: jest
        .fn()
        .mockImplementation((_tx, id, toStatus) => Promise.resolve({ id, status: toStatus })),
    } as unknown as OrderStatusService;
    service = new OrdersService(
      prisma,
      new PricingService(prisma),
      new PromotionsService(prisma),
      stockService,
      orderStatusService,
    );
  }

  beforeEach(() => setup());

  const dto = (body: unknown = validOrderBody) => body as CreateOrderDto;

  describe('tính tổng tiền', () => {
    it('trả về đơn PENDING với mã #id và tổng do server tính', async () => {
      const result = await service.create(7, dto());

      expect(result).toEqual({
        orderId: 1001,
        code: '#1001',
        status: 'PENDING',
        subtotal: EXPECTED_TOTAL,
        discount: 0,
        promoCode: null,
        total: EXPECTED_TOTAL,
        items: [
          { productId: 3, size: 'L', qty: 2, unitPrice: 67000, lineTotal: 134000 },
          { productId: 5, size: 'M', qty: 1, unitPrice: 44000, lineTotal: 44000 },
        ],
        createdAt: '2026-10-24T10:00:00.000Z',
        replayed: false,
      });
    });

    it('lưu Order + OrderItem + OrderItemTopping kèm giá snapshot trong cùng một transaction', async () => {
      await service.create(7, dto());

      expect(fake.prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(fake.db.orders).toEqual([
        expect.objectContaining({
          userId: 7,
          status: 'PENDING',
          subtotal: EXPECTED_TOTAL,
          total: EXPECTED_TOTAL,
        }),
      ]);
      expect(fake.db.orderItems).toEqual([
        {
          orderId: 1001,
          productId: 3,
          size: 'L',
          qty: 2,
          unitPrice: 67000,
          lineTotal: 134000,
          toppings: {
            create: [
              { toppingId: 1, price: 5000 },
              { toppingId: 2, price: 7000 },
            ],
          },
        },
        {
          orderId: 1001,
          productId: 5,
          size: 'M',
          qty: 1,
          unitPrice: 44000,
          lineTotal: 44000,
          toppings: { create: [] },
        },
      ]);
    });

    it('bỏ qua giá giả do client gửi kèm (price, unitPrice, lineTotal, total)', async () => {
      const tampered = {
        total: 1,
        subtotal: 1,
        discount: 999999,
        items: validOrderBody.items.map((item) => ({
          ...item,
          price: 1,
          unitPrice: 1,
          lineTotal: 1,
        })),
      };

      const result = await service.create(7, dto(tampered));

      expect(result.total).toBe(EXPECTED_TOTAL);
      expect(result.discount).toBe(0);
      expect(fake.db.orders[0].total).toBe(EXPECTED_TOTAL);
      expect(fake.db.orderItems.map((i) => i.unitPrice)).toEqual([67000, 44000]);
    });

    it('coi toppingIds bị bỏ trống như không có topping', async () => {
      const result = await service.create(7, dto({ items: [{ productId: 5, size: 'S', qty: 3 }] }));

      expect(result.total).toBe(117000);
    });
  });

  describe('kiểm tra sản phẩm và topping (Sub-task 6.2)', () => {
    it('trả 400 (không phải 404) khi sản phẩm không tồn tại hoặc đã ngừng bán', async () => {
      const promise = service.create(7, dto({ items: [{ productId: 404, size: 'M', qty: 1 }] }));

      await expect(promise).rejects.toBeInstanceOf(BadRequestException);
      await expect(promise).rejects.toThrow("Sản phẩm với mã '404'");
      expect(fake.prisma.$transaction).not.toHaveBeenCalled();
    });

    it('trả 400 khi topping đã ngừng bán', async () => {
      await expect(
        service.create(7, dto({ items: [{ productId: 3, size: 'M', qty: 1, toppingIds: [9] }] })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(fake.prisma.$transaction).not.toHaveBeenCalled();
    });

    it('trả 400 khi topping không thuộc sản phẩm', async () => {
      await expect(
        service.create(7, dto({ items: [{ productId: 5, size: 'M', qty: 1, toppingIds: [1] }] })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('transaction rollback khi lỗi', () => {
    it('không lưu Order nào khi ghi OrderItem thất bại', async () => {
      fake.failOrderItemWith(new Error('Mất kết nối DB'));

      await expect(service.create(7, dto())).rejects.toThrow('Mất kết nối DB');
      expect(fake.db.orders).toHaveLength(0);
      expect(fake.db.orderItems).toHaveLength(0);
    });

    it('ánh xạ P2003 (khóa ngoại) sang 400 và rollback', async () => {
      fake.failOrderItemWith(prismaError('P2003'));

      await expect(service.create(7, dto())).rejects.toBeInstanceOf(BadRequestException);
      expect(fake.db.orders).toHaveLength(0);
    });

    it('ánh xạ P2002 (unique) sang 409 và rollback', async () => {
      fake.failOrderItemWith(prismaError('P2002'));

      await expect(service.create(7, dto())).rejects.toBeInstanceOf(ConflictException);
      expect(fake.db.orders).toHaveLength(0);
    });

    it('giữ nguyên lỗi Prisma khác để filter trả 500', async () => {
      const error = prismaError('P2034');
      fake.failOrderItemWith(error);

      await expect(service.create(7, dto())).rejects.toBe(error);
    });
  });

  describe('mã giảm giá (Sub-task 10.4b)', () => {
    beforeEach(() => setup([promoRow()]));

    it('BREW10 trên 178.000đ → giảm 17.800đ, tổng 160.200đ (trace demo)', async () => {
      const result = await service.create(7, dto({ ...validOrderBody, promoCode: 'BREW10' }));

      expect(result.subtotal).toBe(178000);
      expect(result.discount).toBe(17800);
      expect(result.promoCode).toBe('BREW10');
      expect(result.total).toBe(160200);
      expect(fake.db.orders[0]).toMatchObject({
        subtotal: 178000,
        discount: 17800,
        promoCode: 'BREW10',
        total: 160200,
      });
    });

    it('chuẩn hóa mã khách nhập chữ thường "brew10" thành IN HOA', async () => {
      const result = await service.create(7, dto({ ...validOrderBody, promoCode: 'brew10' }));
      expect(result.promoCode).toBe('BREW10');
      expect(result.discount).toBe(17800);
    });

    it('tăng usedCount trong cùng transaction', async () => {
      await service.create(7, dto({ ...validOrderBody, promoCode: 'BREW10' }));
      expect(fake.db.promotions[0].usedCount).toBe(1);
    });

    it('mã hết hạn → 400 PROMO_EXPIRED, không tạo đơn, không tăng usedCount', async () => {
      setup([promoRow({ code: 'HETHAN', endsAt: new Date('2026-10-01T00:00:00Z') })]);

      await expect(
        service.create(7, dto({ ...validOrderBody, promoCode: 'hethan' })),
      ).rejects.toMatchObject({ status: 400, code: PROMO_ERROR.EXPIRED });

      expect(fake.db.orders).toHaveLength(0);
      expect(fake.db.promotions[0].usedCount).toBe(0);
    });

    it('chưa đủ đơn tối thiểu → 400 PROMO_MIN_ORDER', async () => {
      setup([
        promoRow({ code: 'GIAM15K', type: DiscountType.FIXED, value: 15000, minOrder: 100000 }),
      ]);

      await expect(
        service.create(
          7,
          dto({ items: [{ productId: 5, size: 'M', qty: 1 }], promoCode: 'GIAM15K' }),
        ),
      ).rejects.toMatchObject({ status: 400, code: PROMO_ERROR.MIN_ORDER });
    });

    it('mã đã hết lượt → 400 PROMO_EXHAUSTED và rollback đơn', async () => {
      setup([promoRow({ usageLimit: 1, usedCount: 1 })]);

      await expect(
        service.create(7, dto({ ...validOrderBody, promoCode: 'BREW10' })),
      ).rejects.toMatchObject({ code: PROMO_ERROR.EXHAUSTED });

      expect(fake.db.orders).toHaveLength(0);
    });

    it('mã không tồn tại → 400 PROMO_NOT_FOUND', async () => {
      setup([]);

      await expect(
        service.create(7, dto({ ...validOrderBody, promoCode: 'KHONGCO' })),
      ).rejects.toMatchObject({ code: PROMO_ERROR.NOT_FOUND });
    });
  });

  describe('Idempotency-Key (Sub-task 10.2b)', () => {
    it('cùng key 2 lần chỉ tạo 1 đơn, lần 2 trả replayed = true', async () => {
      const first = await service.create(7, dto(), { idempotencyKey: 'key-1' });
      const second = await service.create(7, dto(), { idempotencyKey: 'key-1' });

      expect(first.replayed).toBe(false);
      expect(second.replayed).toBe(true);
      expect(second.orderId).toBe(first.orderId);
      expect(second.total).toBe(first.total);
      expect(fake.db.orders).toHaveLength(1);
      expect(fake.prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('hai request ĐUA cùng key (transaction song song) vẫn chỉ tạo 1 đơn', async () => {
      const [a, b] = await Promise.all([
        service.create(7, dto(), { idempotencyKey: 'race-key' }),
        service.create(7, dto(), { idempotencyKey: 'race-key' }),
      ]);

      expect(fake.db.orders).toHaveLength(1);
      expect(a.orderId).toBe(b.orderId);
      expect([a.replayed, b.replayed].filter((v) => v === false)).toHaveLength(1);
    });

    it('cùng key nhưng user khác tạo đơn riêng', async () => {
      await service.create(7, dto(), { idempotencyKey: 'shared' });
      const other = await service.create(8, dto(), { idempotencyKey: 'shared' });

      expect(other.replayed).toBe(false);
      expect(fake.db.orders).toHaveLength(2);
    });

    it('không có key thì mỗi lần gọi tạo một đơn mới', async () => {
      await service.create(7, dto());
      await service.create(7, dto());

      expect(fake.db.orders).toHaveLength(2);
    });

    it('key rỗng/toàn khoảng trắng coi như không gửi', async () => {
      await service.create(7, dto(), { idempotencyKey: '   ' });
      await service.create(7, dto(), { idempotencyKey: '' });

      expect(fake.db.orders).toHaveLength(2);
      expect(fake.db.orders[0].idempotencyKey).toBeNull();
    });
  });

  describe('cancel (Hủy đơn hàng - Task 10)', () => {
    it('chủ đơn hàng hủy đơn thành công khi ở trạng thái PENDING/PAID', async () => {
      const order = await service.create(7, dto());
      const result = await service.cancel(7, Role.CUSTOMER, order.orderId, 'Khách muốn đổi món');

      expect(result).toEqual({
        orderId: order.orderId,
        code: `#${order.orderId}`,
        status: OrderStatus.CANCELLED,
      });
    });

    it('Barista hoặc Admin có quyền hủy đơn của khách', async () => {
      const order = await service.create(7, dto());
      const result = await service.cancel(99, Role.BARISTA, order.orderId, 'Hết nguyên liệu');

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('người dùng khác không có quyền hủy đơn của người khác -> 403 Forbidden', async () => {
      const order = await service.create(7, dto());
      await expect(
        service.cancel(8, Role.CUSTOMER, order.orderId, 'Cố tình hủy đơn người khác'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('hủy đơn không tồn tại -> 404 NotFound', async () => {
      await expect(service.cancel(7, Role.CUSTOMER, 99999, 'Đơn không có thật')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('khi hủy đơn có mã giảm giá, hoàn lại lượt dùng', async () => {
      setup([promoRow({ code: 'DISC20', usageLimit: 5, usedCount: 1 })]);
      const created = await service.create(7, dto({ ...validOrderBody, promoCode: 'DISC20' }));
      expect(fake.db.promotions[0].usedCount).toBe(2);

      await service.cancel(7, Role.CUSTOMER, created.orderId);
      expect(fake.db.promotions[0].usedCount).toBe(1);
    });
  });

  it('formatOrderCode thêm tiền tố #', () => {
    expect(formatOrderCode(1001)).toBe('#1001');
  });
});
