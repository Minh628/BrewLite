 'use client';

import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { formatVND } from '@/lib/format';
import { Container } from '@/components/Container';

function categoryEmoji(categoryName: string) {
  if (categoryName === 'Trà') return '🍑';
  if (categoryName === 'Đá xay') return '🥤';
  return '☕';
}

export default function ProductsPage() {
  const { data, isLoading, isError } = useProducts();

  return (
    <Container className="py-10">
      <h1 className="mb-2 text-3xl font-bold">Menu sản phẩm</h1>
      <p className="mb-8 text-sm text-sage">
        Chọn món yêu thích và tùy chỉnh theo ý bạn.
      </p>

      {isLoading && <p>Đang tải menu...</p>}

      {isError && (
        <p role="alert">
          Không tải được menu. Hãy kiểm tra backend rồi thử lại.
        </p>
      )}

      {data && data.length === 0 && <p>Menu đang được cập nhật.</p>}

      {data && data.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-2xl border border-espresso/15 bg-white p-5"
            >
              <div
                className="mb-4 flex h-40 items-center justify-center bg-caramel/20 text-6xl"
                aria-hidden="true"
              >
                {categoryEmoji(product.category.name)}
              </div>

              <h2 className="mb-2 text-lg font-bold">{product.name}</h2>
              <p className="mb-4 font-bold text-caramel">
                {formatVND(product.price)}
              </p>

              <Link
                href={`/products/${product.id}`}
                className="block rounded-full bg-espresso px-4 py-3 text-center text-sm font-bold text-crema hover:bg-caramel"
              >
                Chọn size &amp; topping
              </Link>
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}