'use client';

import Link from 'next/link';
import { useCart } from '@/store/cart';
import { formatVND } from '@/lib/format';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';

export default function CartPage() {
  const { lines, total, updateQty, remove, count, clear } = useCart();

  if (lines.length === 0) {
    return (
      <main className="flex-1 py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon="🛍️"
            title="Giỏ hàng trống"
            description="Bạn chưa có món nào trong giỏ hàng. Hãy quay lại menu để chọn đồ uống yêu thích."
            actionLabel="Về menu chọn món"
            actionHref="/"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 py-8 px-4">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-espresso">Giỏ hàng ({count()})</h1>
          <p className="text-espresso/60 mt-1">Xác nhận đơn hàng trước khi thanh toán</p>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-espresso/10 overflow-hidden">
          <div className="divide-y divide-espresso/10">
            {lines.map((line, index) => (
              <div key={`${line.id}-${line.size}-${index}`} className="flex gap-4 p-4">
                <img
                  src={line.imageUrl}
                  alt={line.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
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
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center border border-espresso/20 rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          updateQty(line.id, line.size, line.toppings, line.quantity - 1)
                        }
                        disabled={line.quantity <= 1}
                        className="px-3 py-1.5 text-espresso hover:bg-espresso/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>
                      <span className="px-4 py-1.5 text-center min-w-[3rem] font-medium text-espresso">
                        {line.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQty(line.id, line.size, line.toppings, line.quantity + 1)
                        }
                        disabled={line.quantity >= 20}
                        className="px-3 py-1.5 text-espresso hover:bg-espresso/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => remove(line.id, line.size, line.toppings)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Xóa
                    </button>
                  </div>
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

          <div className="p-4 border-t border-espresso/10 flex gap-3">
            <Button variant="outline" onClick={clear} className="flex-1">
              Xóa giỏ hàng
            </Button>
            <Link href="/checkout">
              <Button className="flex-1" size="lg">
                Tiến hành thanh toán
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-espresso/50 mt-4">
          Hoặc{' '}
          <Link href="/" className="text-caramel hover:underline">
            tiếp tục chọn món
          </Link>
        </p>
      </div>
    </main>
  );
}
