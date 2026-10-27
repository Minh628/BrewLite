import React from 'react';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import type { ProductDetail } from '@/lib/types';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getProduct(id: number): Promise<ProductDetail | null> {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { cache: 'no-store' });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`API trả ${res.status}`);
    }

    return (await res.json()) as ProductDetail;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('API trả')) {
      throw error;
    }
    throw new Error('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.');
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId)) {
    notFound();
  }

  const product = await getProduct(productId);

  if (!product) {
    notFound();
  }

  const clientProduct = {
    id: product.id,
    name: product.name,
    price: product.price,
    description: product.description ?? '',
    category: product.category.name,
    imageUrl: product.imageUrl ?? '',
    sizes: product.sizes.map((s) => ({ size: s.code, extraPrice: s.extra })),
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden p-6">
        <ProductDetailClient product={clientProduct} />
      </div>
    </main>
  );
}
