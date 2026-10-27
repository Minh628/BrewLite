'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/api';

export type ProductQuery = {
  category?: number;
  q?: string;
};

export function useProducts(query: ProductQuery = {}) {
  return useQuery({
    queryKey: ['products', query.category ?? null, query.q ?? ''],
    queryFn: () => getProducts(query),
  });
}
