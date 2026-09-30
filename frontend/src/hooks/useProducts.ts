'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/api';
import { fetchMockProducts } from '@/lib/mock/products';

const USE_MOCK = true;

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: USE_MOCK ? fetchMockProducts : getProducts,
  });
}
