'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { ApiError, createOrder, createPayment, type PaymentMethod } from '@/lib/api';
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
};

function mapOrderError(err: unknown, lines: CartLine[]): string {
  if (err instanceof ApiError && err.code === 'OUT_OF_STOCK') {
    const productId = err.errorBody?.productId as number | undefined;
    const productName = productId
      ? (lines.find((l) => l.id === productId)?.name ?? 'Một món')
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
  const submitting = useRef(false);

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
            setRetryingSameAttempt(!!parsed.paymentKey);
          }
        } catch {
          sessionStorage.removeItem(storageKey);
        }
      }
    }
    setSessionLoaded(true);
  }, [isAuthenticated, router, storageKey]);

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
      saveSession(checkout);

      if (!checkout.order) {
        const items = lines.map((line) => ({
          productId: line.id,
          size: line.size,
          qty: line.quantity,
          toppingIds: line.toppings.map((t) => t.id),
        }));
        const order = await createOrder(items, checkout.orderKey);
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
      setError(mapOrderError(err, lines));
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 py-8 px-4">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-espresso">Thanh toán</h1>
          <p className="text-espresso/60 mt-1">Xác nhận giỏ hàng và chọn phương thức thanh toán</p>
        </header>

        {!sessionLoaded ? (
          <p role="status">Đang khôi phục phiên thanh toán...</p>
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
                <div className="border-t border-espresso/10 bg-espresso/5 p-4">
                  <div className="flex justify-between text-lg font-semibold text-espresso">
                    <span>Tổng cộng</span>
                    <span>{formatVND(total())}</span>
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
              className="space-y-4 border-t border-espresso/10 p-4"
              aria-label="Phương thức thanh toán"
            >
              <fieldset disabled={isSubmitting || !!session?.paymentKey} className="space-y-3">
                <legend className="mb-2 font-semibold text-espresso">Chọn phương thức</legend>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="payment-method"
                    value="CARD"
                    checked={method === 'CARD'}
                    onChange={() => setMethod('CARD')}
                  />
                  Thẻ ngân hàng
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="payment-method"
                    value="WALLET"
                    checked={method === 'WALLET'}
                    onChange={() => setMethod('WALLET')}
                  />
                  Ví điện tử
                </label>
              </fieldset>

              {method === 'CARD' && (
                <label className="block text-sm font-medium text-espresso">
                  Số thẻ
                  <input
                    autoComplete="cc-number"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(event) => setCardNumber(event.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="mt-1 w-full rounded-lg border border-espresso/20 px-3 py-2"
                  />
                  <span className="mt-1 block text-xs text-espresso/60">
                    Thẻ thử thành công: 4242 4242 4242 4242 · Bị từ chối: 4000 0000 0000 0002
                  </span>
                </label>
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
