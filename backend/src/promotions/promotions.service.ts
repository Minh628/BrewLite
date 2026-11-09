import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  promoExhausted,
  promoExpired,
  promoInactive,
  promoMinOrder,
  promoNotFound,
  PromotionException,
} from './promotion.exception';
import { computeDiscount, normalizePromoCode, PromotionLike } from './promotion-rules';

export interface ValidatedPromotion {
  code: string;
  discount: number;
}

/**
 * PromotionsService (Sub-task 10.4a)
 *
 * Kiểm tra một mã giảm giá có hợp lệ với subtotal hay không và tính số tiền giảm.
 * Tách `evaluate` (thuần túy, không I/O) khỏi `findPromotion` (truy vấn DB) để unit test
 * phủ đủ các nhánh nghiệp vụ mà không cần PostgreSQL.
 */
@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Endpoint POST /promotions/validate dùng: tra DB rồi đánh giá quy tắc.
   * Mã không tồn tại → PROMO_NOT_FOUND; vi phạm quy tắc → PROMO_* tương ứng.
   */
  async validate(
    code: string,
    subtotal: number,
    now: Date = new Date(),
  ): Promise<ValidatedPromotion> {
    const promotion = await this.findPromotion(code);
    return this.evaluate(promotion, subtotal, now);
  }

  /**
   * Truy vấn promotion theo mã đã chuẩn hóa. Chấp nhận tx để dùng chung transaction khi tạo đơn.
   */
  async findPromotion(
    code: string,
    tx: Pick<PrismaService, 'promotion'> = this.prisma,
  ): Promise<PromotionLike> {
    const normalized = normalizePromoCode(code);
    const promotion = await tx.promotion.findUnique({ where: { code: normalized } });

    if (!promotion) {
      throw promoNotFound(normalized);
    }

    return promotion;
  }

  /**
   * Đánh giá thuần túy: không I/O, ném PromotionException khi mã vi phạm quy tắc.
   * Thứ tự kiểm tra theo Mục 11.4 và Mục 11.3.
   */
  evaluate(promotion: PromotionLike, subtotal: number, now: Date = new Date()): ValidatedPromotion {
    const code = promotion.code;

    if (!promotion.isActive) {
      throw promoInactive(code);
    }

    if (now < promotion.startsAt || now > promotion.endsAt) {
      throw promoExpired(code);
    }

    if (subtotal < promotion.minOrder) {
      throw promoMinOrder(code, promotion.minOrder);
    }

    if (promotion.usageLimit != null && promotion.usedCount >= promotion.usageLimit) {
      throw promoExhausted(code);
    }

    return { code, discount: computeDiscount(promotion, subtotal) };
  }

  /**
   * Tăng usedCount có điều kiện trong transaction của đơn hàng (Sub-task 10.4b).
   * updateMany trả 0 dòng khi đã hết lượt → ném PROMO_EXHAUSTED để rollback cả đơn.
   * Không dùng usageLimit null (vô hạn) thì chỉ tăng bình thường.
   */
  async consumeUsage(
    tx: Pick<PrismaService, 'promotion'>,
    promotion: PromotionLike,
  ): Promise<void> {
    if (promotion.usageLimit == null) {
      await tx.promotion.update({
        where: { code: promotion.code },
        data: { usedCount: { increment: 1 } },
      });
      return;
    }

    const result = await tx.promotion.updateMany({
      where: { code: promotion.code, usedCount: { lt: promotion.usageLimit } },
      data: { usedCount: { increment: 1 } },
    });

    if (result.count === 0) {
      throw promoExhausted(promotion.code);
    }
  }

  /**
   * Hoàn lượt khi đơn bị CANCELLED (Mục 11.4: "hoàn lượt khi CANCELLED").
   * Kiểm tra trước usedCount > 0 để không bao giờ giảm âm làm vi phạm CHECK ("usedCount" >= 0).
   */
  async releaseUsage(tx: Pick<PrismaService, 'promotion'>, code: string): Promise<void> {
    if (typeof tx.promotion.findUnique === 'function') {
      const existing = await tx.promotion.findUnique({ where: { code } });
      if (!existing || existing.usedCount <= 0) {
        return;
      }
    }

    await tx.promotion.update({
      where: { code },
      data: { usedCount: { decrement: 1 } },
    });
  }

  /** Kiểm tra kiểu lỗi để controller/service khác phân biệt lỗi nghiệp vụ mã giảm giá. */
  static isPromotionError(error: unknown): error is PromotionException {
    return error instanceof PromotionException;
  }
}
