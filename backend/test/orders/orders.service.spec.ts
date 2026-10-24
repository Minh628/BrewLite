import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateOrderDto } from '../../src/orders/dto/create-order.dto';
import { formatOrderCode, OrdersService } from '../../src/orders/orders.service';
import { PricingService } from '../../src/pricing/pricing.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { EXPECTED_TOTAL, findProductsByIds, validOrderBody } from './order-fixtures';

type Row = Record<string, unknown>;

/**
 * Prisma giả lập có transaction thật sự: ghi vào vùng tạm, chỉ commit khi callback thành công,
 * lỗi giữa chừng thì bỏ toàn bộ vùng tạm (rollback).
 */
function createPrismaFake() {
  const db = { orders: [] as Row[], orderItems: [] as Row[] };
  let nextOrderId = 1001;
  let failOnOrderItem: unknown = null;

  const prisma = {
    product: { findMany: jest.fn(findProductsByIds) },
    $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      const staged = { orders: [] as Row[], orderItems: [] as Row[] };
      const tx = {
        order: {
          create: jest.fn(({ data }: { data: Row }) => {
            const row = { id: nextOrderId++, createdAt: new Date('2026-10-24T10:00:00Z'), ...data };
            staged.orders.push(row);
            return Promise.resolve(row);
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
      };

      const result = await callback(tx);
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

describe('OrdersService (PB-06 / Sub-task 6.3, 6.5)', () => {
  let fake: ReturnType<typeof createPrismaFake>;
  let service: OrdersService;

  beforeEach(() => {
    fake = createPrismaFake();
    const prisma = fake.prisma as unknown as PrismaService;
    service = new OrdersService(prisma, new PricingService(prisma));
  });

  const dto = (body: unknown = validOrderBody) => body as CreateOrderDto;

  describe('tính tổng tiền', () => {
    it('trả về đơn PENDING với mã #id và tổng do server tính', async () => {
      const result = await service.create(7, dto());

      expect(result).toEqual({
        orderId: 1001,
        code: '#1001',
        status: 'PENDING',
        total: EXPECTED_TOTAL,
        items: [
          { productId: 3, size: 'L', qty: 2, unitPrice: 67000, lineTotal: 134000 },
          { productId: 5, size: 'M', qty: 1, unitPrice: 44000, lineTotal: 44000 },
        ],
        createdAt: '2026-10-24T10:00:00.000Z',
      });
    });

    it('lưu Order + OrderItem + OrderItemTopping kèm giá snapshot trong cùng một transaction', async () => {
      await service.create(7, dto());

      expect(fake.prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(fake.db.orders).toEqual([
        expect.objectContaining({ userId: 7, status: 'PENDING', total: EXPECTED_TOTAL }),
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
        items: validOrderBody.items.map((item) => ({
          ...item,
          price: 1,
          unitPrice: 1,
          lineTotal: 1,
        })),
      };

      const result = await service.create(7, dto(tampered));

      expect(result.total).toBe(EXPECTED_TOTAL);
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

  it('formatOrderCode thêm tiền tố #', () => {
    expect(formatOrderCode(1001)).toBe('#1001');
  });
});
