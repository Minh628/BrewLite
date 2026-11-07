'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '@/lib/api';
import { formatVND } from '@/lib/format';

function categoryEmoji(categoryName: string) {
  if (categoryName === 'Trà') return '🍑';
  if (categoryName === 'Đá xay') return '🥤';
  return '☕';
}

export function ProductCard({ product }: { product: Product }) {
  const [imageError, setImageError] = useState(false);
  const hasImage = Boolean(product.imageUrl) && !imageError;

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-espresso/15 bg-white/70 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative flex h-52 items-center justify-center bg-caramel/20 transition group-hover:bg-caramel/30">
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl as string}
              alt={product.name}
              className="max-h-44 max-w-[75%] object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <span aria-hidden="true" className="text-7xl">
              {categoryEmoji(product.category.name)}
            </span>
          )}
        </div>
        <div className="space-y-1 px-5 pt-5 pb-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold">{product.name}</h2>
            <span className="whitespace-nowrap text-sm font-bold text-caramel">
              {formatVND(product.price)}
            </span>
          </div>
          <p className="text-sm text-sage">Pha mới theo lựa chọn của bạn</p>
        </div>
      </Link>
    </article>
  );
}
