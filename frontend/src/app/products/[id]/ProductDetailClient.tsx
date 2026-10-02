'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SizeSelector, { SizeCode } from '@/components/SizeSelector';
import ToppingSelector, { TOPPING_OPTIONS } from '@/components/ToppingSelector';

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

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState<SizeCode>('S');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  const extraSizePrice = SIZE_PRICES[selectedSize] || 0;

  const extraToppingPrice = selectedToppings.reduce((total, id) => {
    const topping = TOPPING_OPTIONS.find((item) => item.id === id);
    return total + (topping ? topping.price : 0);
  }, 0);

  const totalPrice = (product?.price || 0) + extraSizePrice + extraToppingPrice;

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
            {totalPrice.toLocaleString('vi-VN')} đ
          </p>
          
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            {product?.description}
          </p>

          <hr className="my-4 border-gray-200" />

          {/* Sub-task 4.2: Bộ chọn Size */}
          <SizeSelector
            selectedSize={selectedSize}
            onChangeSize={(size) => setSelectedSize(size)}
          />

          {/* Sub-task 4.3: Bộ chọn Topping */}
          <ToppingSelector
            selectedToppings={selectedToppings}
            onChangeToppings={(toppings) => setSelectedToppings(toppings)}
          />
        </div>

        {/* Nút hành động */}
        <div className="pt-4 flex gap-4">
          <button
            onClick={() => {
              alert(
                `Đã thêm vào giỏ:\n- Món: ${product?.title}\n- Size: ${selectedSize}\n- Topping: ${
                  selectedToppings.length > 0 ? selectedToppings.length + ' loại' : 'Không'
                }\n- Tổng tiền: ${totalPrice.toLocaleString('vi-VN')}đ`
              );
            }}
            className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            Thêm vào giỏ hàng
          </button>
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