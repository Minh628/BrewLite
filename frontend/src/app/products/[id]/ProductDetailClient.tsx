'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useToastActions } from '@/hooks/useToast';
import SizeSelector from '@/components/SizeSelector';
import { ToppingSelector } from '@/components/ToppingSelector';
import { calcUnitPrice, type AvailableSize, type SelectedTopping } from '@/lib/pricing';
import { formatVND } from '@/lib/format';
import { useCart } from '@/store/cart';
import { Button } from '@/components/Button';

interface Product {
  id: number | string;
  title: string;
  price: number;
  description: string;
  category?: string;
  image?: string;
  sizes?: AvailableSize[];
  toppings?: SelectedTopping[];
}

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('S');
  const [selectedToppings, setSelectedToppings] = useState<SelectedTopping[]>([]);
  const add = useCart((state) => state.add);
  const { show: toast } = useToastActions();

  const sizeOption = product.sizes?.find((s) => s.size === selectedSize) ?? {
    size: 'S',
    extraPrice: 0,
  };

  const unitPrice = calcUnitPrice(product.price, sizeOption, selectedToppings);

  const handleAddToCart = () => {
    add({
      product: {
        id: Number(product.id),
        name: product.title,
        price: product.price,
        imageUrl: product.image ?? '',
        category: { id: 0, name: product.category ?? '' },
        isAvailable: true,
      },
      size: selectedSize,
      sizeExtra: sizeOption.extraPrice,
      toppings: selectedToppings,
    });
    toast(`Đã thêm "${product.title}" (${selectedSize}) vào giỏ hàng`);
  };

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

          <h1 className="mb-2 text-2xl font-bold leading-snug text-gray-900">{product.title}</h1>

          <p className="mb-4 text-3xl font-bold tracking-tight text-blue-600">
            {formatVND(unitPrice)}
          </p>

          <p className="mb-6 text-sm leading-relaxed text-gray-600">{product.description}</p>

          <hr className="my-4 border-gray-200" />

          <SizeSelector
            sizes={
              product.sizes ?? [
                { size: 'S', extraPrice: 0 },
                { size: 'M', extraPrice: 5000 },
                { size: 'L', extraPrice: 10000 },
              ]
            }
            selectedSize={selectedSize}
            onChangeSize={setSelectedSize}
          />

          <ToppingSelector
            toppings={product.toppings ?? []}
            selectedToppings={selectedToppings}
            onChangeToppings={setSelectedToppings}
          />
        </div>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
          <Button onClick={handleAddToCart} className="flex-1" size="lg">
            Thêm vào giỏ hàng
          </Button>

          <Link
            href="/products"
            className="flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Quay lại
          </Link>
        </div>
      </div>
    </div>
  );
}
