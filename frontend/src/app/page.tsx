'use client';

import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/store/cart';
import { Container } from '@/components/Container';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import { ProductGridEmpty } from '@/components/product/ProductGridEmpty';
import { ProductGridError } from '@/components/product/ProductGridError';

export default function Home() {
  const { data, isLoading, isError, refetch } = useProducts();

  return (
    <Container className="py-10">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-sage">
          Today&apos;s pour
        </p>
        <h1 className="text-3xl font-bold">Chọn món yêu thích</h1>
        <p className="mt-1 text-sm text-sage">
          Menu tươi mỗi ngày · thanh toán không dùng tiền mặt
        </p>
      </div>

      {isLoading && <ProductGridSkeleton />}
      {isError && <ProductGridError onRetry={() => refetch()} />}
      {data && data.length === 0 && <ProductGridEmpty />}
      {data && data.length > 0 && <ProductGrid products={data} />}
    </Container>
  );
}
