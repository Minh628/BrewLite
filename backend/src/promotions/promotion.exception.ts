import { BadRequestException } from '@nestjs/common';
import { PROMO_ERROR, type PromoErrorCode } from './promotion-rules';

/**
 * Lỗi nghiệp vụ của mã giảm giá: HTTP 400 + `code` PROMO_* theo contract v3 (Mục 11.3).
 * HttpExceptionFilter đọc trường `code` để trả về cho client.
 */
export class PromotionException extends BadRequestException {
  readonly code: PromoErrorCode;

  constructor(code: PromoErrorCode, message: string) {
    super({ statusCode: 400, code, message, error: 'Bad Request' });
    this.code = code;
  }
}

export function promoNotFound(code: string): PromotionException {
  return new PromotionException(PROMO_ERROR.NOT_FOUND, `Mã giảm giá '${code}' không tồn tại`);
}

export function promoInactive(code: string): PromotionException {
  return new PromotionException(PROMO_ERROR.INACTIVE, `Mã giảm giá '${code}' đã bị tạm ngưng`);
}

export function promoExpired(code: string): PromotionException {
  return new PromotionException(
    PROMO_ERROR.EXPIRED,
    `Mã giảm giá '${code}' đã hết hạn hoặc chưa tới thời gian sử dụng`,
  );
}

export function promoMinOrder(code: string, minOrder: number): PromotionException {
  return new PromotionException(
    PROMO_ERROR.MIN_ORDER,
    `Mã giảm giá '${code}' chỉ áp dụng cho đơn tối thiểu ${minOrder}đ`,
  );
}

export function promoExhausted(code: string): PromotionException {
  return new PromotionException(PROMO_ERROR.EXHAUSTED, `Mã giảm giá '${code}' đã hết lượt sử dụng`);
}
