import React from 'react';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

interface Category {
  id: number;
  name: string;
}

interface ProductSize {
  code: 'S' | 'M' | 'L';
  extra: number;
}

interface ProductTopping {
  id: number;
  name: string;
  price: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string;
  category: Category;
  isAvailable: boolean;
  sizes: ProductSize[];
  toppings: ProductTopping[];
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: number): Promise<Product | null> {
  let isBackendServerDown = false;

  try {
    const res = await fetch(`http://localhost:3001/products/${id}`, {
      cache: 'no-store',
    });

    if (res.ok) {
      return await res.json();
    }

    if (res.status === 404) {
      return null;
    }
  } catch {
    isBackendServerDown = true;
  }

  if (isBackendServerDown) {
    try {
      const res = await fetch(`https://fakestoreapi.com/products/${id}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          name: data.title,
          price: data.price * 25000,
          description: data.description,
          imageUrl: data.image,
          category: { id: 0, name: data.category },
          isAvailable: true,
          sizes: [
            { code: 'S', extra: 0 },
            { code: 'M', extra: 5000 },
            { code: 'L', extra: 10000 },
          ],
          toppings: [
            { id: 1, name: 'Trân châu', price: 5000 },
            { id: 2, name: 'Kem cheese', price: 7000 },
            { id: 3, name: 'Thạch trái cây', price: 5000 },
          ],
        };
      }
    } catch {
      // Fallback cũng lỗi
    }
  }

  return null;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  if (!product) {
    notFound();
  }

  const clientProduct = {
    id: product.id,
    title: product.name,
    price: product.price,
    description: product.description ?? '',
    category: product.category.name,
    image: product.imageUrl,
    sizes: product.sizes.map((s) => ({ size: s.code, extraPrice: s.extra })),
    toppings: product.toppings.map((t) => ({ id: t.id, name: t.name, price: t.price })),
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden p-6">
        <ProductDetailClient product={clientProduct} />
      </div>
    </main>
  );
}
