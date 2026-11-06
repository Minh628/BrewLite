'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import {
  ApiError,
  createOrder,
  createPayment,
  validatePromotion,
  type PaymentMethod,
  type ValidatedPromotion,
} from '@/lib/api';
import { formatVND } from '@/lib/format';
import type { CartLine } from '@/store/cart';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import Link from 'next/link';

type CreatedOrder = { orderId: number; code: string; status: string; total: number };
type CheckoutSession = {
  orderKey: string;
  order?: CreatedOrder;
  paymentKey?: string;
  paymentMethod?: PaymentMethod;
  paymentCardLast4?: string | null;
  promoCode?: string;
  discount?: number;
};

function mapOrderError(err: unknown): string {
  return err instanceof Error ? err.message : 'Đặt hàng thất bại. Vui lòng thử lại.';
}

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { lines, total, clear } = useCart();
  const storageKey = user ? `brewlite-checkout:${user.id}` : null;
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryingSameAttempt, setRetryingSameAttempt] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<ValidatedPromotion | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent('/checkout')}`);
      return;
    }

    if (storageKey) {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as CheckoutSession;
          if (typeof parsed.orderKey === 'string') {
            setSession(parsed);
            if (parsed.paymentMethod) setMethod(parsed.paymentMethod);
            if (parsed.promoCode && parsed.discount) {
              setAppliedPromo({ code: parsed.promoCode, discount: parsed.discount });
            }
            setRetryingSameAttempt(!!parsed.paymentKey);
          }
        } catch {
          sessionStorage.removeItem(storageKey);
        }
      }
    }
    setSessionLoaded(true);
  }, [isAuthenticated, router, storageKey]);

  const handleApplyPromo = async () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Vui lòng nhập mã khuyến mãi.');
      return;
    }
    setIsValidatingPromo(true);
    setPromoError(null);
    try {
      const result = await validatePromotion(code, total());
      setAppliedPromo(result);
      setPromoError(null);
    } catch (err: unknown) {
      setAppliedPromo(null);
      if (err instanceof ApiError) {
        if (err.code === 'PROMO_NOT_FOUND') setPromoError('Mã khuyến mãi không tồn tại.');
        else if (err.code === 'PROMO_INACTIVE') setPromoError('Mã khuyến mãi đang tạm ngưng.');
        else if (err.code === 'PROMO_EXPIRED') setPromoError('Mã khuyến mãi đã hết hạn.');
        else if (err.code === 'PROMO_MIN_ORDER')
          setPromoError('Đơn hàng chưa đủ giá trị tối thiểu.');
        else if (err.code === 'PROMO_EXHAUSTED')
          setPromoError('Mã khuyến mãi đã hết lượt sử dụng.');
        else setPromoError(err.message || 'Mã khuyến mãi không hợp lệ.');
      } else {
        setPromoError('Không thể áp dụng mã. Vui lòng thử lại.');
      }
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoError(null);
  };

  const saveSession = (next: CheckoutSession) => {
    setSession(next);
    if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify(next));
  };

  if (!isAuthenticated) return null;

  const handlePay = async () => {
    if (lines.length === 0 || submitting.current || (method === 'CARD' && !cardNumber.trim())) {
      if (method === 'CARD' && !cardNumber.trim()) setError('Vui lòng nhập số thẻ.');
      return;
    }
    if (method === 'CARD' && !/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      setError('Số thẻ phải gồm 16 chữ số.');
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      let checkout = session ?? { orderKey: newIdempotencyKey() };
      if (appliedPromo) {
        checkout = { ...checkout, promoCode: appliedPromo.code, discount: appliedPromo.discount };
      }
      saveSession(checkout);

      if (!checkout.order) {
        const items = lines.map((line) => ({
          productId: line.id,
          size: line.size,
          qty: line.quantity,
          toppingIds: line.toppings.map((t) => t.id),
        }));
        const order = await createOrder(items, checkout.orderKey, appliedPromo?.code);
        checkout = { ...checkout, order };
        saveSession(checkout);
      }
      if (!checkout.order) {
        throw new Error('Không thể khôi phục đơn hàng. Vui lòng thử lại.');
      }
      const order = checkout.order;

      const paymentKey = checkout.paymentKey ?? newIdempotencyKey();
      const cardLast4 = method === 'CARD' ? cardNumber.replace(/\s/g, '').slice(-4) : null;
      if (checkout.paymentKey && checkout.paymentCardLast4 !== cardLast4) {
        throw new Error('Nhập lại đúng phương thức và số thẻ đã dùng ở yêu cầu trước.');
      }
      checkout = {
        ...checkout,
        paymentKey,
        paymentMethod: method,
        paymentCardLast4: cardLast4,
      };
      saveSession(checkout);
      setRetryingSameAttempt(false);

      const payment = await createPayment(
        order.orderId,
        method,
        paymentKey,
        method === 'CARD' ? cardNumber : undefined,
      );

      if (payment.status === 'PAYMENT_FAILED') {
        const message = payment.failureReason ?? 'Thanh toán thất bại.';
        checkout = {
          ...checkout,
          paymentKey: undefined,
          paymentMethod: undefined,
          paymentCardLast4: undefined,
        };
        saveSession(checkout);
        setRetryingSameAttempt(false);
        setError(`${message}. Bạn có thể đổi phương thức hoặc thử lại.`);
        return;
      }

      clear();
      if (storageKey) sessionStorage.removeItem(storageKey);
      router.push(`/orders/${order.orderId}`);
    } catch (err) {
      setRetryingSameAttempt(true);
      setError(mapOrderError(err));
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  const subtotal = total();
  const discountAmount = appliedPromo?.discount ?? 0;
  const finalTotal = session?.order ? session.order.total : Math.max(0, subtotal - discountAmount);

  return (
    <main className="flex-1 py-8 px-4">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-espresso">Thanh toán</h1>
          <p className="text-espresso/60 mt-1">Xác nhận giỏ hàng và chọn phương thức thanh toán</p>
        </header>

        {!isMounted || !sessionLoaded ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-espresso/10 rounded w-1/4" />
            <div className="h-64 bg-white rounded-2xl border border-espresso/10" />
          </div>
        ) : lines.length === 0 && !session?.order ? (
          <EmptyState
            icon="🛍️"
            title="Giỏ hàng trống"
            description="Bạn chưa có món nào trong giỏ hàng"
            actionLabel="Về menu chọn món"
            actionHref="/"
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-espresso/10 bg-white shadow-sm">
            {lines.length > 0 && (
              <>
                <div className="divide-y divide-espresso/10">
                  {lines.map((line, index) => (
                    <div key={`${line.id}-${line.size}-${index}`} className="flex gap-4 p-4">
                      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-espresso/5">
                        {line.imageUrl ? (
                          <img
                            src={line.imageUrl}
                            alt={line.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span aria-hidden="true" className="text-3xl">
                            ☕
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-semibold text-espresso">{line.name}</h2>
                        <p className="mt-0.5 text-sm text-espresso/60">
                          Size: {line.size} · Số lượng: {line.quantity}
                          {line.toppings.length > 0 &&
                            ` · Topping: ${line.toppings.map((t) => t.name).join(', ')}`}
                        </p>
                        <p className="mt-1 font-medium text-caramel">
                          {formatVND(line.unitPrice * line.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ô nhập mã khuyến mãi / Voucher */}
                <div className="border-t border-espresso/10 p-4 bg-crema/20">
                  <label
                    htmlFor="promo-input"
                    className="block text-sm font-semibold text-espresso mb-2"
                  >
                    Mã khuyến mãi
                  </label>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">🎟️</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-800 text-sm tracking-wide font-mono">
                              {appliedPromo.code}
                            </span>
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                              Đã áp dụng
                            </span>
                          </div>
                          <p className="text-xs text-emerald-700 mt-0.5">
                            Giảm {formatVND(appliedPromo.discount)} cho đơn hàng
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        disabled={isSubmitting || !!session?.order}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Bỏ mã
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          id="promo-input"
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          placeholder="Nhập mã khuyến mãi"
                          disabled={isSubmitting || isValidatingPromo || !!session?.order}
                          className="flex-1 rounded-xl border border-espresso/20 bg-white px-3.5 py-2.5 text-sm uppercase font-mono font-medium tracking-wider focus:outline-none focus:ring-2 focus:ring-caramel/50 focus:border-caramel shadow-sm transition"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyPromo}
                          loading={isValidatingPromo}
                          disabled={
                            isSubmitting ||
                            isValidatingPromo ||
                            !promoCodeInput.trim() ||
                            !!session?.order
                          }
                          className="px-5 text-sm font-semibold rounded-xl shadow-sm"
                        >
                          Áp dụng
                        </Button>
                      </div>
                    </div>
                  )}
                  {promoError && (
                    <p className="mt-2 text-xs font-medium text-red-600" role="alert">
                      {promoError}
                    </p>
                  )}
                </div>

                <div className="border-t border-espresso/10 bg-espresso/5 p-4 space-y-2">
                  <div className="flex justify-between text-sm text-espresso/70">
                    <span>Tạm tính (Subtotal)</span>
                    <span className="font-medium text-espresso">{formatVND(subtotal)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-sm text-emerald-700 font-semibold">
                      <span>Giảm giá khuyến mãi</span>
                      <span>-{formatVND(appliedPromo.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-espresso pt-2 border-t border-espresso/10">
                    <span>Tổng thanh toán</span>
                    <span className="text-caramel font-black text-xl">{formatVND(finalTotal)}</span>
                  </div>
                </div>
              </>
            )}

            {session?.order && (
              <p className="border-t border-espresso/10 p-4 text-sm text-espresso/70">
                Đơn #{session.order.code || session.order.orderId} đã được tạo. Tiếp tục thanh toán
                để hoàn tất.
              </p>
            )}

            <section
              className="space-y-5 border-t border-espresso/10 p-5 bg-white"
              aria-label="Phương thức thanh toán"
            >
              <fieldset disabled={isSubmitting || !!session?.paymentKey} className="space-y-3">
                <legend className="mb-3 font-bold text-espresso text-base">
                  Phương thức thanh toán
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      method === 'CARD'
                        ? 'border-caramel bg-caramel/5 ring-2 ring-caramel/30 font-semibold text-espresso shadow-sm'
                        : 'border-espresso/15 bg-cream/20 hover:bg-cream/40 text-espresso/80'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value="CARD"
                      checked={method === 'CARD'}
                      onChange={() => setMethod('CARD')}
                      className="accent-caramel h-4 w-4"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💳</span>
                      <div>
                        <div className="font-semibold text-sm">Thẻ ngân hàng</div>
                        <div className="text-[11px] text-espresso/60">Visa, Mastercard, ATM</div>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      method === 'WALLET'
                        ? 'border-caramel bg-caramel/5 ring-2 ring-caramel/30 font-semibold text-espresso shadow-sm'
                        : 'border-espresso/15 bg-cream/20 hover:bg-cream/40 text-espresso/80'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value="WALLET"
                      checked={method === 'WALLET'}
                      onChange={() => setMethod('WALLET')}
                      className="accent-caramel h-4 w-4"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📱</span>
                      <div>
                        <div className="font-semibold text-sm">Ví điện tử</div>
                        <div className="text-[11px] text-espresso/60">Ví BrewLite Pay</div>
                      </div>
                    </div>
                  </label>
                </div>
              </fieldset>

              {method === 'CARD' && (
                <div className="rounded-xl border border-espresso/15 bg-cream/10 p-4 space-y-2">
                  <label
                    htmlFor="card-number-input"
                    className="block text-sm font-semibold text-espresso"
                  >
                    Số thẻ thanh toán
                  </label>
                  <input
                    id="card-number-input"
                    autoComplete="cc-number"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(event) => setCardNumber(event.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full rounded-xl border border-espresso/20 bg-white px-3.5 py-2.5 font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-caramel/50 focus:border-caramel shadow-sm transition"
                  />
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-espresso/60">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>
                      Thẻ thành công:{' '}
                      <code className="font-mono font-semibold text-espresso">
                        4242 4242 4242 4242
                      </code>
                    </span>
                    <span>·</span>
                    <span>
                      Thẻ từ chối: <code className="font-mono text-espresso">4000...0002</code>
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <Button
                onClick={handlePay}
                className="w-full"
                size="lg"
                loading={isSubmitting}
                disabled={!sessionLoaded || isSubmitting || (lines.length === 0 && !session?.order)}
              >
                {isSubmitting
                  ? 'Đang xử lý thanh toán...'
                  : retryingSameAttempt
                    ? 'Thử lại cùng yêu cầu'
                    : session?.order
                      ? 'Thanh toán'
                      : 'Tạo đơn và thanh toán'}
              </Button>
              <p className="text-center text-sm text-espresso/50">
                Giỏ hàng chỉ được xóa sau khi thanh toán thành công.{' '}
                <Link href="/cart" className="text-caramel hover:underline">
                  Quay lại giỏ hàng
                </Link>
              </p>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
