'use client';

import Link from 'next/link';
import type { Product } from '@/lib/api';
import { formatVND } from '@/lib/format';
import { useCart } from '@/store/cart';

function categoryEmoji(categoryName: string) {
  if (categoryName === 'Trà') return '🍑';
  if (categoryName === 'Đá xay') return '🥤';
  return '☕';
}

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((state) => state.add);

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-espresso/15 bg-white/70 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/products/${product.id}`} className="block">
        <div
          className="flex h-52 items-center justify-center bg-caramel/20 text-7xl transition group-hover:bg-caramel/30"
          aria-hidden="true"
        >
          {categoryEmoji(product.category.name)}
        </div>
        <div className="space-y-1 px-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold">{product.name}</h2>
            <span className="whitespace-nowrap text-sm font-bold text-caramel">
              {formatVND(product.price)}
            </span>
          </div>
          <p className="text-sm text-sage">Pha mới theo lựa chọn của bạn</p>
        </div>
      </Link>
      <div className="p-5 pt-3">
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
