'use client';

import React, { useState } from 'react';
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
  const { add } = useCart();
  const { show: toast } = useToastActions();

  const sizeOption = product.sizes?.find((s) => s.size === selectedSize) ?? {
    size: 'S',
    extraPrice: 0,
  };

  const unitPrice = calcUnitPrice(product.price, sizeOption, selectedToppings);

  const handleAddToCart = () => {
    const line = {
      id: Number(product.id),
      name: product.title,
      price: product.price,
      imageUrl: product.image ?? '',
      category: { id: 0, name: product.category ?? '' },
      isAvailable: true,
      size: selectedSize,
      toppings: selectedToppings.map((t) => ({ id: 0, name: '', price: t.price })),
      unitPrice,
    };
    add(line);
    toast(`Đã thêm "${product.title}" (${selectedSize}) vào giỏ hàng`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start font-sans">
      {/* Hình ảnh sản phẩm */}
      <div className="w-full h-80 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center p-4 border relative">
        <img
          src={product?.image || '/placeholder.png'}
          alt={product?.title || 'Product'}
          className="max-h-full max-w-full object-contain p-2"
        />
      </div>

      {/* Thông tin & Tùy chọn */}
      <div className="flex flex-col justify-between space-y-6">
        <div>
          {product?.category && (
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
              {product.category}
            </span>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">{product?.title}</h1>

          <p className="text-3xl font-bold text-blue-600 mb-4 tracking-tight">
            {formatVND(unitPrice)}
          </p>

          <p className="text-gray-600 text-sm leading-relaxed mb-6">{product?.description}</p>

          <hr className="my-4 border-gray-200" />

          {/* Sub-task 4.2: Bộ chọn Size */}
          <SizeSelector
            sizes={
              product.sizes ?? [
                { size: 'S', extraPrice: 0 },
                { size: 'M', extraPrice: 5000 },
                { size: 'L', extraPrice: 10000 },
              ]
            }
            selectedSize={selectedSize}
            onChangeSize={(size) => setSelectedSize(size)}
          />

          {/* Sub-task 4.3: Bộ chọn Topping */}
          <ToppingSelector
            toppings={product.toppings ?? []}
            selectedToppings={selectedToppings}
            onChangeToppings={(toppings) => setSelectedToppings(toppings)}
          />
        </div>

        {/* Nút hành động */}
        <div className="pt-4 flex gap-4">
          <Button onClick={handleAddToCart} className="flex-1" size="lg">
            Thêm vào giỏ hàng
          </Button>
          <Link
            href="/products"
            className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center justify-center"
          >
            Quay lại
          </Link>
        </div>
      </div>
    </div>
  );
}
