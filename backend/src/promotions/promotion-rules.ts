import { DiscountType } from '@prisma/client';

/**
 * Mã lỗi promotion dùng chung giữa service và filter (Mục 11.3 Sprint 3).
 * Trả về HTTP 400 kèm `code` tương ứng qua PromotionException.
 */
export const PROMO_ERROR = {
  NOT_FOUND: 'PROMO_NOT_FOUND',
  INACTIVE: 'PROMO_INACTIVE',
  EXPIRED: 'PROMO_EXPIRED',
  MIN_ORDER: 'PROMO_MIN_ORDER',
  EXHAUSTED: 'PROMO_EXHAUSTED',
} as const;

export type PromoErrorCode = (typeof PROMO_ERROR)[keyof typeof PROMO_ERROR];

/**
 * Tối thiểu các trường của Promotion cần cho việc tính giảm giá.
 * Dùng kiểu cấu trúc để test thuần túy không cần Prisma.
 */
export interface PromotionLike {
  code: string;
  type: DiscountType;
  /** PERCENT: 1–100 · FIXED: số tiền VND */
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  startsAt: Date;
  endsAt: Date;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
}

/**
 * Chuẩn hóa mã giảm giá: trim + IN HOA vì mã lưu trong DB dạng IN HOA và
 * không phân biệt hoa thường khi khách nhập (Mục 11.4).
 */
export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Quy tắc giảm giá (Mục 11.4):
 * - PERCENT: floor(subtotal × value / 100), không vượt maxDiscount.
 * - FIXED: min(value, subtotal).
 * - Không bao giờ vượt subtotal, không âm.
 */
export function computeDiscount(promotion: PromotionLike, subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return 0;
  }

  let discount: number;

  if (promotion.type === DiscountType.PERCENT) {
    const percent = Math.min(Math.max(promotion.value, 0), 100);
    discount = Math.floor((subtotal * percent) / 100);
    if (promotion.maxDiscount != null) {
      discount = Math.min(discount, promotion.maxDiscount);
    }
  } else {
    discount = Math.max(promotion.value, 0);
  }

  return Math.max(0, Math.min(discount, subtotal));
}
