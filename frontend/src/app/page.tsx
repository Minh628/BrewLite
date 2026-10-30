'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Container } from '@/components/Container';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import { ProductGridEmpty } from '@/components/product/ProductGridEmpty';
import { ProductGridError } from '@/components/product/ProductGridError';
import { MenuFilters } from '@/components/product/MenuFilters';
import { MenuEmptyState } from '@/components/product/MenuEmptyState';
import { buildMenuUrl, parseCategoryParam } from '@/lib/menu-query';

function MenuContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlCategory = parseCategoryParam(searchParams.get('category'));
  const urlQuery = searchParams.get('q') ?? '';

  const [searchInput, setSearchInput] = useState(urlQuery);
  const debouncedQuery = useDebouncedValue(searchInput.trim(), 300);

  const { data: categories } = useCategories();
  const { data, isLoading, isFetching, isError, refetch } = useProducts({
    category: urlCategory ?? undefined,
    q: debouncedQuery || undefined,
  });

  useEffect(() => {
    const target = buildMenuUrl(pathname, urlCategory, debouncedQuery, searchParams.toString());
    const currentUrl = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    if (target !== currentUrl) {
      router.replace(target, { scroll: false });
    }
  }, [debouncedQuery, pathname, router, searchParams, urlCategory]);

  const handleSelectCategory = useCallback(
    (categoryId: number | null) => {
      router.replace(buildMenuUrl(pathname, categoryId, debouncedQuery, searchParams.toString()), {
        scroll: false,
      });
    },
    [pathname, router, searchParams, debouncedQuery],
  );

  const handleReset = useCallback(() => {
    setSearchInput('');
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const isLoadingList = isLoading || (isFetching && !data);
  const hasFilters = urlCategory !== null || debouncedQuery !== '';

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

      <MenuFilters
        categories={categories ?? []}
        selectedCategory={urlCategory}
        searchInput={searchInput}
        onSelectCategory={handleSelectCategory}
        onSearchChange={setSearchInput}
        onReset={handleReset}
      />

      <p aria-live="polite" className="sr-only">
        {data ? `${data.length} món phù hợp` : ''}
      </p>

      {isLoadingList && <ProductGridSkeleton />}
      {isError && <ProductGridError onRetry={() => refetch()} />}
      {data && data.length === 0 && !hasFilters && <ProductGridEmpty />}
      {data && data.length === 0 && hasFilters && <MenuEmptyState onReset={handleReset} />}
      {data && data.length > 0 && <ProductGrid products={data} />}
    </Container>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <Container className="py-10">
          <ProductGridSkeleton />
        </Container>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
