'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import {
  ApiError,
  createOrder,
  createPayment,
  createVnpayPaymentUrl,
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

function mapOrderError(err: unknown, lines?: CartLine[]): string {
  if (err instanceof ApiError && err.code === 'OUT_OF_STOCK') {
    const productId = err.errorBody?.productId as number | undefined;
    const productName = productId
      ? (lines?.find((l) => l.id === productId)?.name ?? 'Một món')
      : 'Một món';
    return `${productName} vừa hết hàng. Vui lòng kiểm tra lại giỏ hàng.`;
  }
  return err instanceof Error ? err.message : 'Đặt hàng thất bại. Vui lòng thử lại.';
}

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user, hasHydrated } = useAuth();
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
    // Đợi Zustand hoàn tất rehydrate từ localStorage trước khi kiểm tra đăng nhập
    if (!hasHydrated) return;

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
  }, [hasHydrated, isAuthenticated, router, storageKey]);

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
    if (lines.length === 0 || submitting.current) {
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

      // 1. Tạo đơn hàng mới nếu chưa có đơn trong checkout session
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
        throw new Error('Không thể khởi tạo đơn hàng. Vui lòng thử lại.');
      }
      let order = checkout.order;

      // 2. Tạo URL thanh toán VNPay Sandbox v2.1.0 cho cả CARD và WALLET
      let paymentUrl = '';
      try {
        const res = await createVnpayPaymentUrl(order.orderId, method);
        paymentUrl = res.paymentUrl;
      } catch (urlErr: unknown) {
        const msg = urlErr instanceof Error ? urlErr.message : '';
        // Tự phục hồi: Nếu đơn cũ trong session đã thanh toán (PAID) hoặc không thể thanh toán tiếp,
        // tự động dọn sạch session cũ và tạo ngay một đơn hàng mới toanh cho giỏ hàng hiện tại!
        if (
          msg.includes('PAID') ||
          msg.includes('không thể thanh toán tiếp') ||
          msg.includes('Không tìm thấy')
        ) {
          if (storageKey) sessionStorage.removeItem(storageKey);
          checkout = { orderKey: newIdempotencyKey() };
          if (appliedPromo) {
            checkout = {
              ...checkout,
              promoCode: appliedPromo.code,
              discount: appliedPromo.discount,
            };
          }
          const items = lines.map((line) => ({
            productId: line.id,
            size: line.size,
            qty: line.quantity,
            toppingIds: line.toppings.map((t) => t.id),
          }));
          const newOrder = await createOrder(items, checkout.orderKey, appliedPromo?.code);
          checkout = { ...checkout, order: newOrder };
          saveSession(checkout);
          order = newOrder;

          const res = await createVnpayPaymentUrl(order.orderId, method);
          paymentUrl = res.paymentUrl;
        } else {
          throw urlErr;
        }
      }

      // Lưu lại trạng thái checkout session trước khi redirect sang cổng VNPay
      checkout = {
        ...checkout,
        paymentMethod: method,
      };
      saveSession(checkout);

      // 3. Chuyển hướng người dùng sang cổng thanh toán VNPay Sandbox
      window.location.href = paymentUrl;
    } catch (err) {
      setRetryingSameAttempt(true);
      setError(mapOrderError(err, lines));
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
              <div className="flex items-center justify-between border-t border-espresso/10 p-4 text-xs sm:text-sm text-espresso/70 bg-amber-50/50">
                <span>
                  Đơn <strong>{session.order.code || `#${session.order.orderId}`}</strong> đang được
                  liên kết với lượt thanh toán này.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (storageKey) sessionStorage.removeItem(storageKey);
                    setSession(null);
                  }}
                  className="text-xs text-caramel hover:underline font-semibold ml-2 flex-shrink-0"
                >
                  Làm mới đơn
                </button>
              </div>
            )}

            <section
              className="space-y-5 border-t border-espresso/10 p-5 bg-white"
              aria-label="Phương thức thanh toán"
            >
              <fieldset disabled={isSubmitting} className="space-y-3">
                <legend className="mb-3 font-bold text-espresso text-base flex items-center justify-between">
                  <span>Phương thức thanh toán</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Cổng VNPay Sandbox
                  </span>
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
                        <div className="font-semibold text-sm">Thẻ ngân hàng (CARD)</div>
                        <div className="text-[11px] text-espresso/60">
                          ATM nội địa, Visa, Mastercard
                        </div>
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
                        <div className="font-semibold text-sm">Ví điện tử (WALLET)</div>
                        <div className="text-[11px] text-espresso/60">
                          Quét mã VNPAY-QR / Ví điện tử
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </fieldset>

              {/* Hộp thông tin thẻ thử nghiệm VNPay Sandbox */}
              <div className="rounded-xl border border-blue-200/90 bg-blue-50/60 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold text-blue-900 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <span aria-hidden="true">🛡️</span>
                    <span>Cổng thanh toán VNPay Sandbox v2.1.0</span>
                  </div>
                  <a
                    href="https://sandbox.vnpayment.vn/apis/vnpay-demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline hover:no-underline"
                  >
                    <span>Tra cứu thẻ test Sandbox</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>

                <p className="text-blue-900/80 leading-relaxed">
                  Khi sang giao diện VNPay, chọn tab{' '}
                  <strong>&quot;Thẻ nội địa và tài khoản ngân hàng&quot;</strong> &rarr; Chọn logo{' '}
                  <strong>NCB</strong> và nhập thông tin test:
                </p>

                <div className="bg-white rounded-lg p-3 border border-blue-200 font-mono text-[11px] space-y-1.5 text-espresso">
                  <div className="flex items-center justify-between">
                    <span>Số thẻ (viết liền):</span>
                    <strong className="text-blue-900 font-bold tracking-wider select-all">
                      9704198526191432198
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tên chủ thẻ:</span>
                    <strong className="select-all">NGUYEN VAN A</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ngày phát hành:</span>
                    <strong className="select-all">07/15</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Mã OTP xác thực:</span>
                    <strong className="select-all">123456</strong>
                  </div>
                </div>

                <div className="pt-1 text-[11px] text-blue-900/70 flex items-center justify-between flex-wrap gap-1">
                  <span>💡 Hoặc quét VNPAY-QR và bấm giả lập thanh toán thành công.</span>
                  <a
                    href="https://sandbox.vnpayment.vn/apis/vnpay-demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline font-medium"
                  >
                    sandbox.vnpayment.vn/apis/vnpay-demo
                  </a>
                </div>
              </div>

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
                className="w-full bg-caramel hover:bg-caramel-strong text-white font-bold"
                size="lg"
                loading={isSubmitting}
                disabled={!sessionLoaded || isSubmitting || (lines.length === 0 && !session?.order)}
              >
                {isSubmitting ? 'Đang kết nối cổng VNPay...' : 'Tiến hành thanh toán qua VNPay'}
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
