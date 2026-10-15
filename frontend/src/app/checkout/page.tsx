'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { formatVND } from '@/lib/format';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { lines, total, clear } = useCart();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent('/checkout')}`);
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const handlePlaceOrder = async () => {
    if (lines.length === 0) return;

    try {
      const { createOrder } = await import('@/lib/api');
      const items = lines.map((line) => ({
        productId: line.id,
        size: (line as any).size ?? 'S',
        quantity: line.quantity,
        toppingIds: (line as any).toppings?.map((t: any) => t.id) ?? [],
      }));
      const result = await createOrder(items);
      clear();
      router.push(`/order/${result.orderId}`);
      router.refresh();
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Đặt hàng thất bại. Vui lòng thử lại.');
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
                <div key={`${line.id}-${index}`} className="flex gap-4 p-4">
                  <img
                    src={line.imageUrl}
                    alt={line.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-espresso truncate">{line.name}</h3>
                    <p className="text-sm text-espresso/60 mt-0.5">
                      Size: {(line as any).size ?? 'S'}
                      {(line as any).toppings?.length && (
                        <>
                          {' · '}
                          Topping: {(line as any).toppings.map((t: any) => t.name).join(', ')}
                        </>
                      )}
                    </p>
                    <p className="text-sm text-espresso/60 mt-0.5">Số lượng: {line.quantity}</p>
                    <p className="font-medium text-caramel mt-1">
                      {formatVND((line as any).unitPrice ?? line.price * line.quantity)}
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
              <Button onClick={handlePlaceOrder} className="w-full" size="lg">
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
