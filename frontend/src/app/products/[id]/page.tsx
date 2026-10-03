import React from 'react';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category?: string;
  image?: string;
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string): Promise<Product | null> {
  let isBackendServerDown = false;

  try {
    const res = await fetch(`http://localhost:3001/products/${id}`, {
      cache: 'no-store',
    });

    // 1. Nếu Backend chạy và trả về kết quả thành công
    if (res.ok) {
      return await res.json();
    }

    // 2. Nếu Backend chạy nhưng trả về 404 (Không tìm thấy ID này trong DB)
    if (res.status === 404) {
      return null; // Trả về null để trang chạy vào notFound()
    }
  } catch {
    // 3. Chỉ khi Backend chưa bật (Server Down / Offline) thì mới đánh dấu để fallback
    isBackendServerDown = true;
  }

  // CHỈ FALLBACK KHI BACKEND TẮT HOÀN TOÀN (Dùng để test giao diện lúc chưa bật Backend)
  if (isBackendServerDown) {
    try {
      const res = await fetch(`https://fakestoreapi.com/products/${id}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          title: data.title,
          price: data.price * 25000,
          description: data.description,
          category: data.category,
          image: data.image,
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

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden p-6">
        <ProductDetailClient product={product} />
      </div>
    </main>
  );
}