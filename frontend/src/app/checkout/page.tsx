'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { createOrder } from '@/lib/api';
import { formatVND } from '@/lib/format';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import Link from 'next/link';

type CreatedOrder = { orderId: number; code: string; status: string; total: number };

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { lines, total, clear } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent('/checkout')}`);
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (createdOrder) {
    return (
      <main className="flex-1 py-12 px-4">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-black text-espresso mb-2">
            Đã tạo đơn #{createdOrder.code || createdOrder.orderId}
          </h1>
          <p className="text-espresso/70 mb-1">Trạng thái: {createdOrder.status}</p>
          <p className="text-lg font-bold text-caramel mb-6">
            Tổng tiền (server tính): {formatVND(createdOrder.total)}
          </p>
          <Link href="/" className="text-caramel hover:underline">
            Về menu chọn món
          </Link>
        </div>
      </main>
    );
  }

  const handlePlaceOrder = async () => {
    if (lines.length === 0 || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const items = lines.map((line) => ({
        productId: line.id,
        size: line.size,
        qty: line.quantity,
        toppingIds: line.toppings.map((t) => t.id),
      }));
      const result = await createOrder(items);
      setCreatedOrder(result);
      clear();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 py-8 px-4">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-espresso">Đặt hàng</h1>
          <p className="text-espresso/60 mt-1">Xác nhận đơn hàng của bạn</p>
        </header>

        {lines.length === 0 ? (
          <EmptyState
            icon="🛍️"
            title="Giỏ hàng trống"
            description="Bạn chưa có món nào trong giỏ hàng"
            actionLabel="Về menu chọn món"
            actionHref="/"
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-espresso/10 overflow-hidden">
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
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-espresso truncate">{line.name}</h3>
                    <p className="text-sm text-espresso/60 mt-0.5">
                      Size: {line.size}
                      {line.toppings.length > 0 && (
                        <>
                          {' · '}
                          Topping: {line.toppings.map((t) => t.name).join(', ')}
                        </>
                      )}
                    </p>
                    <p className="text-sm text-espresso/60 mt-0.5">Số lượng: {line.quantity}</p>
                    <p className="font-medium text-caramel mt-1">
                      {formatVND(line.unitPrice * line.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-espresso/5 border-t border-espresso/10">
              <div className="flex justify-between text-lg font-semibold text-espresso">
                <span>Tổng cộng</span>
                <span>{formatVND(total())}</span>
              </div>
            </div>

            <div className="p-4 border-t border-espresso/10">
              <p className="text-sm text-espresso/60 mb-4">
                Đơn hàng sẽ được tạo với trạng thái PENDING. Sau khi thanh toán thành công, đơn sẽ
                chuyển sang PAID.
              </p>
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}
              <Button
                onClick={handlePlaceOrder}
                className="w-full"
                size="lg"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Đặt hàng
              </Button>
              <p className="text-center text-sm text-espresso/50 mt-3">
                Hoặc{' '}
                <Link href="/" className="text-caramel hover:underline">
                  tiếp tục chọn món
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
