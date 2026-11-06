import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProductCard } from './ProductCard';
import { ProductGrid } from './ProductGrid';
import type { Product } from '@/lib/api';

const product: Product = {
  id: 1,
  name: 'Bạc xỉu',
  price: 35000,
  imageUrl: null,
  category: { id: 1, name: 'Cà phê' },
  isAvailable: true,
};

describe('ProductGrid', () => {
  it('renders product cards and product detail links', () => {
    const markup = renderToStaticMarkup(
      <ProductGrid products={[product, { ...product, id: 2, name: 'Americano' }]} />,
    );

    expect(markup).toContain('Bạc xỉu');
    expect(markup).toContain('Americano');
    expect(markup).toContain('href="/products/1"');
  });
});

describe('ProductCard', () => {
  it('renders product card with name, price and link', () => {
    const markup = renderToStaticMarkup(<ProductCard product={product} />);

    expect(markup).toContain('Bạc xỉu');
    expect(markup).toContain('Pha mới theo lựa chọn của bạn');
    expect(markup).toContain('href="/products/1"');
  });
});
