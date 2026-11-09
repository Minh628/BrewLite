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
  inStock?: boolean;
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
  const outOfStock = product.inStock === false;
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('S');
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<SelectedTopping[]>([]);
  const [imageError, setImageError] = useState(false);
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
    add(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl ?? '',
        category: { id: 0, name: product.category ?? '' },
        isAvailable: true,
        size: selectedSize,
        toppings: selectedToppings,
        unitPrice,
      },
      quantity,
    );
    router.push('/cart');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start font-sans">
      <div className="w-full h-80 rounded-2xl overflow-hidden flex items-center justify-center p-6 border border-espresso/10 bg-caramel/10 relative shadow-sm">
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
            className="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <span aria-label={product.name} className="text-8xl drop-shadow-sm">
              {product.category === 'Trà' ? '🍑' : product.category === 'Đá xay' ? '🥤' : '☕'}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between space-y-6">
        <div>
          {product.category && (
            <span className="inline-block px-3 py-1 bg-caramel/15 text-espresso text-xs font-bold rounded-full uppercase tracking-wider mb-2">
              {product.category}
            </span>
          )}
          <h1 className="text-2xl font-bold text-espresso mb-2 leading-snug">{product.name}</h1>

          <p className="text-3xl font-black text-caramel mb-4 tracking-tight">
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

          {/* Điều khiển số lượng: Tự do nhập hoặc dùng nút tăng giảm */}
          <div className="mt-5 space-y-2">
            <span className="text-sm font-semibold text-espresso">Số lượng</span>
            <div className="inline-flex items-center rounded-xl border border-espresso/20 bg-cream/40 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold text-espresso hover:bg-white active:scale-95 transition"
                aria-label="Giảm số lượng"
              >
                −
              </button>
              <input
                aria-label="Số lượng"
                type="number"
                min={1}
                max={999}
                value={quantity}
                onChange={(event) => {
                  const val = parseInt(event.target.value, 10);
                  if (isNaN(val)) {
                    setQuantity(1);
                  } else {
                    setQuantity(Math.max(1, Math.min(999, val)));
                  }
                }}
                className="w-16 bg-transparent text-center font-bold text-espresso focus:outline-none focus:ring-0 text-base"
              />
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.min(999, prev + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold text-espresso hover:bg-white active:scale-95 transition"
                aria-label="Tăng số lượng"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          {outOfStock ? (
            <span className="flex-1 inline-flex items-center justify-center rounded-xl bg-espresso/20 px-5 py-3.5 text-base font-bold text-espresso/50 cursor-not-allowed shadow-inner">
              Hết hàng
            </span>
          ) : (
            <Button
              onClick={handleAddToCart}
              className="flex-1 shadow-md hover:shadow-lg"
              size="lg"
            >
              Thêm vào giỏ hàng • {formatVND(unitPrice * quantity)}
            </Button>
          )}
          <Link
            href="/"
            className="px-5 py-3 border border-espresso/20 text-espresso font-semibold rounded-xl hover:bg-cream/50 transition flex items-center justify-center shadow-sm"
          >
            Quay lại
          </Link>
        </div>
      </div>
    </div>
  );
}
