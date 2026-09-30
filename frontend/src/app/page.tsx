'use client';

import { useProducts } from '@/hooks/useProducts';
import { formatVND } from '@/lib/format';
import type { Product } from '@/lib/api';
import { useCart } from '@/store/cart';

function categoryEmoji(categoryName: string) {
  if (categoryName === 'Trà') return '🍑';
  if (categoryName === 'Đá xay') return '🥤';
  return '☕';
}

function ProductCard({ product }: { product: Product }) {
  const add = useCart((state) => state.add);
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-[#d9c9b6] bg-white/70 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div
        className="flex h-52 items-center justify-center bg-[#e9dccb] text-7xl transition group-hover:bg-[#dfc8ac]"
        aria-hidden="true"
      >
        {categoryEmoji(product.category.name)}
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold">{product.name}</h2>
          <span className="whitespace-nowrap text-sm font-bold text-[#a65721]">
            {formatVND(product.price)}
          </span>
        </div>
        <p className="text-sm text-[#75675a]">Pha mới theo lựa chọn của bạn</p>
        <button
          onClick={() => add(product)}
          className="w-full rounded-full bg-[#2b2118] px-4 py-3 text-sm font-bold text-[#fffaf3] transition hover:bg-[#a65721]"
        >
          Thêm vào giỏ
        </button>
      </div>
    </article>
  );
}

export default function Home() {
  const { data, isLoading, isError } = useProducts();
  const lines = useCart((state) => state.lines);
  const total = useCart((state) => state.total());

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#ead6bd_0,_transparent_35%),linear-gradient(135deg,_#f7f0e7,_#efe4d5)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7 lg:px-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a65721]">
            BrewLite coffee bar
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
            Một ly đúng gu,
            <br />
            <span className="text-[#a65721]">không cần xếp hàng.</span>
          </h1>
        </div>
        <div className="rounded-full border border-[#d9c9b6] bg-white/60 px-4 py-2 text-sm font-bold">
          Giỏ hàng ({lines.length}) · {formatVND(total)}
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#66735b]">
              Today&apos;s pour
            </p>
            <h2 className="text-3xl font-bold">Chọn món yêu thích</h2>
          </div>
          <span className="hidden text-sm text-[#75675a] md:block">
            Menu tươi mỗi ngày · thanh toán không tiền mặt
          </span>
        </div>
        {isLoading && (
          <div className="rounded-3xl border border-dashed border-[#bda98f] p-12 text-center text-[#75675a]">
            Đang mở menu...
          </div>
        )}
        {isError && (
          <div className="rounded-3xl border border-[#c87532] bg-[#fff3e5] p-12 text-center">
            Không kết nối được backend. Hãy chạy `npm run dev:db` và `npm run dev`.
          </div>
        )}
        {data && data.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#bda98f] p-12 text-center">
            Menu đang được cập nhật.
          </div>
        )}
        {data && data.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
