'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import SizeSelector from '@/components/SizeSelector';
import { ToppingSelector } from '@/components/ToppingSelector';
import { getToppings } from '@/lib/api';
import { calcUnitPrice, type AvailableSize, type SelectedTopping } from '@/lib/pricing';
import { formatVND } from '@/lib/format';
import { useCart } from '@/store/cart';
import { Button } from '@/components/Button';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category?: string;
  imageUrl?: string;
  sizes?: AvailableSize[];
}

interface ProductDetailClientProps {
  product: Product;
}

const DEFAULT_SIZES: AvailableSize[] = [
  { size: 'S', extraPrice: 0 },
  { size: 'M', extraPrice: 5000 },
  { size: 'L', extraPrice: 10000 },
];

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('S');
  const [selectedToppings, setSelectedToppings] = useState<SelectedTopping[]>([]);
  const { add } = useCart();
  const { data: toppings, isLoading: isLoadingToppings } = useQuery({
    queryKey: ['toppings'],
    queryFn: getToppings,
    staleTime: 5 * 60 * 1000,
  });

  const sizes = product.sizes?.length ? product.sizes : DEFAULT_SIZES;
  const sizeOption = sizes.find((s) => s.size === selectedSize) ?? sizes[0];
  const unitPrice = calcUnitPrice(product.price, sizeOption, selectedToppings);

  const handleAddToCart = () => {
    add({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl ?? '',
      category: { id: 0, name: product.category ?? '' },
      isAvailable: true,
      size: selectedSize,
      toppings: selectedToppings,
      unitPrice,
    });
    router.push('/cart');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start font-sans">
      <div className="w-full h-80 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center p-4 border relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="max-h-full max-w-full object-contain p-2"
          />
        ) : (
          <span aria-label={product.name} className="text-7xl text-espresso/40">
            ☕
          </span>
        )}
      </div>

      <div className="flex flex-col justify-between space-y-6">
        <div>
          {product.category && (
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
              {product.category}
            </span>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">{product.name}</h1>

          <p className="text-3xl font-bold text-blue-600 mb-4 tracking-tight">
            {formatVND(unitPrice)}
          </p>

          <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>

          <hr className="my-4 border-gray-200" />

          <SizeSelector
            sizes={sizes}
            selectedSize={selectedSize}
            onChangeSize={(size) => setSelectedSize(size)}
          />

          {isLoadingToppings ? (
            <p className="text-sm text-espresso/60 mt-4">Đang tải topping...</p>
          ) : (
            <ToppingSelector
              toppings={toppings ?? []}
              selectedToppings={selectedToppings}
              onChangeToppings={(next) => setSelectedToppings(next)}
            />
          )}
        </div>

        <div className="pt-4 flex gap-4">
          <Button onClick={handleAddToCart} className="flex-1" size="lg">
            Thêm vào giỏ hàng
          </Button>
          <Link
            href="/"
            className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center justify-center"
          >
            Quay lại
          </Link>
        </div>
      </div>
    </div>
  );
}
