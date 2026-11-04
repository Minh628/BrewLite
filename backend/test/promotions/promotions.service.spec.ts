import { DiscountType, Prisma } from '@prisma/client';
import { PROMO_ERROR } from '../../src/promotions/promotion-rules';
import { PromotionsService } from '../../src/promotions/promotions.service';
import { PrismaService } from '../../src/prisma/prisma.service';

const NOW = new Date('2026-11-02T10:00:00Z');

function promo(overrides: Partial<Prisma.PromotionGetPayload<object>> = {}) {
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
    ...overrides,
  };
}

function createService(promotion: ReturnType<typeof promo> | null = promo()) {
  const prisma = {
    promotion: {
      findUnique: jest.fn(() => Promise.resolve(promotion)),
    },
  };

  return { service: new PromotionsService(prisma as unknown as PrismaService), prisma };
}

/** Chạy validate và trả về mã lỗi nghiệp vụ (nếu có) để kiểm tra từng nhánh. */
async function expectPromoError(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toMatchObject({ status: 400, code });
}

describe('PromotionsService (Sub-task 10.4a)', () => {
  describe('tính giảm giá hợp lệ', () => {
    // Ca 1: PERCENT dưới trần
    it('PERCENT 10% trên 178.000đ → giảm 17.800đ (trace demo Sprint 3)', async () => {
      const { service } = createService();
      await expect(service.validate('brew10', 178000, NOW)).resolves.toEqual({
        code: 'BREW10',
        discount: 17800,
      });
    });

    // Ca 2: PERCENT bị chặn bởi maxDiscount
    it('PERCENT 50% trên 100.000đ nhưng trần 20.000đ → chỉ giảm 20.000đ', async () => {
      const { service } = createService(promo({ value: 50, maxDiscount: 20000 }));
      await expect(service.validate('BREW10', 100000, NOW)).resolves.toEqual({
        code: 'BREW10',
        discount: 20000,
      });
    });

    // Ca 3: FIXED không vượt subtotal
    it('FIXED 15.000đ trên 100.000đ → giảm 15.000đ', async () => {
      const { service } = createService(
        promo({ code: 'GIAM15K', type: DiscountType.FIXED, value: 15000, minOrder: 100000 }),
      );
      await expect(service.validate('giam15k', 100000, NOW)).resolves.toEqual({
        code: 'GIAM15K',
        discount: 15000,
      });
    });

    it('FIXED lớn hơn subtotal → chỉ giảm tối đa bằng subtotal, không âm', async () => {
      const { service } = createService(
        promo({ code: 'GIAM15K', type: DiscountType.FIXED, value: 15000 }),
      );
      await expect(service.validate('GIAM15K', 9000, NOW)).resolves.toEqual({
        code: 'GIAM15K',
        discount: 9000,
      });
    });

    it('PERCENT làm tròn xuống theo floor', async () => {
      const { service } = createService(promo({ value: 15, maxDiscount: null }));
      // 33333 * 15% = 4999.95 → floor = 4999
      await expect(service.validate('BREW10', 33333, NOW)).resolves.toEqual({
        code: 'BREW10',
        discount: 4999,
      });
    });
  });

  describe('mã không hợp lệ', () => {
    it('mã không tồn tại → PROMO_NOT_FOUND', async () => {
      const { service } = createService(null);
      await expectPromoError(service.validate('KHONGCO', 100000, NOW), PROMO_ERROR.NOT_FOUND);
    });

    it('mã đang tạm ngưng → PROMO_INACTIVE', async () => {
      const { service } = createService(promo({ isActive: false }));
      await expectPromoError(service.validate('BREW10', 100000, NOW), PROMO_ERROR.INACTIVE);
    });

    it('mã đã hết hạn → PROMO_EXPIRED', async () => {
      const { service } = createService(
        promo({ code: 'HETHAN', endsAt: new Date('2026-10-01T00:00:00Z') }),
      );
      await expectPromoError(service.validate('hethan', 100000, NOW), PROMO_ERROR.EXPIRED);
    });

    it('mã chưa tới thời gian sử dụng → PROMO_EXPIRED', async () => {
      const { service } = createService(promo({ startsAt: new Date('2026-12-01T00:00:00Z') }));
      await expectPromoError(service.validate('BREW10', 100000, NOW), PROMO_ERROR.EXPIRED);
    });

    it('chưa đủ giá trị đơn tối thiểu → PROMO_MIN_ORDER', async () => {
      const { service } = createService(
        promo({ code: 'GIAM15K', type: DiscountType.FIXED, value: 15000, minOrder: 100000 }),
      );
      await expectPromoError(service.validate('GIAM15K', 44000, NOW), PROMO_ERROR.MIN_ORDER);
    });

    it('mã đã hết lượt → PROMO_EXHAUSTED', async () => {
      const { service } = createService(promo({ usageLimit: 5, usedCount: 5 }));
      await expectPromoError(service.validate('BREW10', 100000, NOW), PROMO_ERROR.EXHAUSTED);
    });
  });

  describe('chuẩn hóa mã', () => {
    it('trim và chuyển IN HOA trước khi tra DB', async () => {
      const { service, prisma } = createService();
      await service.validate('  brew10  ', 100000, NOW);
      expect(prisma.promotion.findUnique).toHaveBeenCalledWith({ where: { code: 'BREW10' } });
    });
  });

  describe('consumeUsage (Sub-task 10.4b)', () => {
    it('tăng usedCount có điều kiện khi còn lượt', async () => {
      const promotion = promo({ usageLimit: 5, usedCount: 1 });
      const tx = {
        promotion: {
          update: jest.fn(),
          updateMany: jest.fn(() => Promise.resolve({ count: 1 })),
        },
      };

      await createService(promotion).service.consumeUsage(tx as never, promotion);

      expect(tx.promotion.updateMany).toHaveBeenCalledWith({
        where: { code: 'BREW10', usedCount: { lt: 5 } },
        data: { usedCount: { increment: 1 } },
      });
      expect(tx.promotion.update).not.toHaveBeenCalled();
    });

    it('ném PROMO_EXHAUSTED khi updateMany không cập nhật dòng nào (hết lượt do đua)', async () => {
      const promotion = promo({ usageLimit: 5, usedCount: 4 });
      const tx = {
        promotion: {
          update: jest.fn(),
          updateMany: jest.fn(() => Promise.resolve({ count: 0 })),
        },
      };

      await expectPromoError(
        createService(promotion).service.consumeUsage(tx as never, promotion),
        PROMO_ERROR.EXHAUSTED,
      );
    });

    it('usageLimit null (vô hạn) thì chỉ tăng usedCount', async () => {
      const promotion = promo({ usageLimit: null });
      const tx = {
        promotion: {
          update: jest.fn(() => Promise.resolve({})),
          updateMany: jest.fn(),
        },
      };

      await createService(promotion).service.consumeUsage(tx as never, promotion);

      expect(tx.promotion.update).toHaveBeenCalledWith({
        where: { code: 'BREW10' },
        data: { usedCount: { increment: 1 } },
      });
    });
  });

  describe('releaseUsage (hoàn lượt khi CANCELLED)', () => {
    it('giảm usedCount theo mã', async () => {
      const tx = { promotion: { update: jest.fn(() => Promise.resolve({})) } };
      await createService().service.releaseUsage(tx as never, 'BREW10');
      expect(tx.promotion.update).toHaveBeenCalledWith({
        where: { code: 'BREW10' },
        data: { usedCount: { decrement: 1 } },
      });
    });
  });
});
