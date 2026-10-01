'use client';

import { useProducts } from '@/hooks/useProducts';
import { formatVND } from '@/lib/format';
import type { Product } from '@/lib/api';
import { useCart } from '@/store/cart';
import { Container } from '@/components/Container';

function categoryEmoji(categoryName: string) {
  if (categoryName === 'Trà') return '🍑';
  if (categoryName === 'Đá xay') return '🥤';
  return '☕';
}

function ProductCard({ product }: { product: Product }) {
  const add = useCart((state) => state.add);
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-espresso/15 bg-white/70 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div
        className="flex h-52 items-center justify-center bg-caramel/20 text-7xl transition group-hover:bg-caramel/30"
        aria-hidden="true"
      >
        {categoryEmoji(product.category.name)}
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold">{product.name}</h2>
          <span className="whitespace-nowrap text-sm font-bold text-caramel">
            {formatVND(product.price)}
          </span>
        </div>
        <p className="text-sm text-sage">Pha mới lựa chọn theo ý bạn</p>
        <button
          onClick={() => add(product)}
          className="w-full rounded-full bg-espresso px-4 py-3 text-sm font-bold text-crema transition hover:bg-caramel"
        >
          Thêm vào giỏ
        </button>
      </div>
    </article>
  );
}

export default function Home() {
  const { data, isLoading, isError } = useProducts();

  return (
    <Container className="py-10">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-sage">
          Today&apos;s pour
        </p>
        <h1 className="text-3xl font-bold">Chọn món yêu thích</h1>
        <p className="mt-1 text-sm text-sage">Menu tươi mỗi ngày - thanh toán không tiền mặt</p>
      </div>

      {isLoading && (
        <div className="rounded-3xl border border-dashed border-espresso/25 p-12 text-center text-sage">
          Đang mở menu...
        </div>
      )}
      {isError && (
        <div className="rounded-3xl border border-caramel bg-caramel/10 p-12 text-center">
          Không kết nối được backend. Hãy chạy `npm run dev:db` và `npm run dev`.
        </div>
      )}
      {data && data.length === 0 && (
        <div className="rounded-3xl border border-dashed border-espresso/25 p-12 text-center">
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
    </Container>
  );
}
