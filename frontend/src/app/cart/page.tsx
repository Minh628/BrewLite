
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/store/cart';

function formatPrice(price: number) {
  return `${price.toLocaleString('vi-VN')} ₫`;
}

export default function CartPage() {
  const lines = useCart((state) => state.lines);
  const increase = useCart((state) => state.increase);
  const decrease = useCart((state) => state.decrease);
  const remove = useCart((state) => state.remove);
  const total = useCart((state) => state.total());
  const count = useCart((state) => state.count());

  return (
    <main className="min-h-screen bg-crema px-4 py-10 text-espresso sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-medium text-espresso/70 hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso"
        >
          ← Tiếp tục mua hàng
        </Link>

        <h1 className="mt-4 text-3xl font-black">Giỏ hàng của bạn</h1>

        <p className="mt-2 text-sm text-espresso/60">
          {count} món trong giỏ hàng
        </p>

        {lines.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-espresso/10 bg-white p-8 text-center">
            <p className="text-lg font-bold">Giỏ hàng đang trống</p>

            <p className="mt-2 text-sm text-espresso/60">
              Chọn một món yêu thích để bắt đầu nhé!
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex rounded-full bg-espresso px-6 py-3 font-bold text-crema transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso"
            >
              Khám phá menu
            </Link>
          </section>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
            <section
              className="space-y-4"
              aria-label="Các món trong giỏ hàng"
            >
              {lines.map((line) => (
                <article
                  key={line.cartId}
                  className="rounded-2xl border border-espresso/10 bg-white p-4 sm:p-5"
                >
                  <div className="flex gap-4">
                    {line.imageUrl ? (
                      <Image
                        src={line.imageUrl}
                        alt={line.name}
                        width={80}
                        height={80}
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                        unoptimized
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-crema text-3xl"
                      >
                        ☕
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold">{line.name}</h2>

                      <p className="mt-1 text-sm text-espresso/60">
                        Size {line.size}
                      </p>

                      {line.toppings.length > 0 && (
                        <p className="mt-1 text-sm text-espresso/60">
                          Topping:{' '}
                          {line.toppings
                            .map((topping) => topping.name)
                            .join(', ')}
                        </p>
                      )}

                      <p className="mt-2 font-semibold">
                        {formatPrice(line.unitPrice)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(line.cartId)}
                      aria-label={`Xóa ${line.name} khỏi giỏ hàng`}
                      className="self-start text-sm text-red-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                    >
                      Xóa
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-espresso/10 pt-4">
                    <span className="text-sm text-espresso/60">
                      Số lượng
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => decrease(line.cartId)}
                        aria-label={`Giảm số lượng ${line.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-espresso/20 font-bold hover:bg-crema focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso"
                      >
                        −
                      </button>

                      <span
                        aria-live="polite"
                        aria-atomic="true"
                        className="min-w-5 text-center font-bold"
                      >
                        {line.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => increase(line.cartId)}
                        disabled={line.quantity >= 20}
                        aria-label={`Tăng số lượng ${line.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-espresso/20 font-bold hover:bg-crema focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-bold">
                      {formatPrice(line.unitPrice * line.quantity)}
                    </span>
                  </div>
                </article>
              ))}
            </section>

            <aside
              aria-label="Tóm tắt đơn hàng"
              className="h-fit rounded-2xl border border-espresso/10 bg-white p-5"
            >
              <h2 className="text-lg font-bold">Tóm tắt đơn hàng</h2>

              <div className="mt-4 flex justify-between text-sm">
                <span className="text-espresso/60">Số lượng</span>
                <span>{count} món</span>
              </div>

              <div className="mt-3 flex justify-between gap-3 border-t border-espresso/10 pt-4">
                <span className="font-bold">Tổng cộng</span>

                <span className="text-right text-lg font-black">
                  {formatPrice(total)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="mt-6 flex w-full justify-center rounded-full bg-espresso px-5 py-3 text-center font-bold text-crema transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2"
              >
                Tiến hành thanh toán
              </Link>

              <p className="mt-3 text-xs leading-5 text-espresso/50">
                Kiểm tra thông tin nhận hàng ở bước tiếp theo. Chức năng gửi
                đơn sẽ được kết nối với API checkout.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
