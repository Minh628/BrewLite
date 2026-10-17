
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SizeSelector, { SizeCode } from '@/components/SizeSelector';
import ToppingSelector, {
  TOPPING_OPTIONS,
  ToppingOption,
} from '@/components/ToppingSelector';
import { getToppings } from '@/lib/api';
import { calcUnitPrice } from '@/lib/pricing';
import { useCart } from '@/store/cart';

interface Product {
  id: number | string;
  title: string;
  price: number;
  description: string;
  category?: string;
  image?: string;
}

interface ProductDetailClientProps {
  product: Product;
}

const SIZE_PRICES: Record<SizeCode, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

export default function ProductDetailClient({
  product,
}: ProductDetailClientProps) {
  const add = useCart((state) => state.add);

  const [selectedSize, setSelectedSize] = useState<SizeCode>('S');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [toppings, setToppings] =
    useState<ToppingOption[]>(TOPPING_OPTIONS);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadToppings() {
      try {
        const data = await getToppings();

        if (cancelled) return;

        setToppings(
          data.map((topping) => ({
            id: String(topping.id),
            name: topping.name,
            price: topping.price,
          })),
        );
      } catch {
        // Giữ topping mẫu nếu API chưa khả dụng.
      }
    }

    loadToppings();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedToppingObjects = selectedToppings
    .map((id) => toppings.find((topping) => topping.id === id))
    .filter((topping): topping is ToppingOption => Boolean(topping));

  const unitPrice = calcUnitPrice(
    product.price,
    {
      size: selectedSize,
      extraPrice: SIZE_PRICES[selectedSize],
    },
    selectedToppingObjects.map((topping) => ({
      price: topping.price,
    })),
  );

  function handleAddToCart() {
    add({
      product: {
        id: Number(product.id),
        name: product.title,
        price: product.price,
        imageUrl: product.image ?? '/placeholder.png',
        category: {
          id: 0,
          name: product.category ?? '',
        },
        isAvailable: true,
      },
      size: selectedSize,
      sizeExtra: SIZE_PRICES[selectedSize],
      toppings: selectedToppingObjects,
    });

    setToast('Đã thêm món vào giỏ hàng');

    window.setTimeout(() => {
      setToast(null);
    }, 2500);
  }

  const imageSrc = product.image || '/placeholder.png';

  return (
    <div className="grid grid-cols-1 items-start gap-8 font-sans md:grid-cols-2">
      <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-lg border bg-gray-50 p-4">
        <Image
          src={imageSrc}
          alt={product.title || 'Product'}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-6"
          unoptimized
        />
      </div>

      <div className="flex flex-col justify-between space-y-6">
        <div>
          {product.category && (
            <span className="mb-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-800">
              {product.category}
            </span>
          )}

          <h1 className="mb-2 text-2xl font-bold leading-snug text-gray-900">
            {product.title}
          </h1>

          <p className="mb-4 text-3xl font-bold tracking-tight text-blue-600">
            {unitPrice.toLocaleString('vi-VN')} đ
          </p>

          <p className="mb-6 text-sm leading-relaxed text-gray-600">
            {product.description}
          </p>

          <hr className="my-4 border-gray-200" />

          <SizeSelector
            selectedSize={selectedSize}
            onChangeSize={setSelectedSize}
          />

          <ToppingSelector
            selectedToppings={selectedToppings}
            onChangeToppings={setSelectedToppings}
          />
        </div>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Thêm vào giỏ hàng
          </button>

          <Link
            href="/products"
            className="flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Quay lại
          </Link>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-4 z-50 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg sm:right-6"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
