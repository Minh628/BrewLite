'use client';

import React from 'react';
import type { Topping } from '@/lib/api';

export interface ToppingOption {
  id: number;
  name: string;
  price: number;
}

interface ToppingSelectorProps {
  toppings: ToppingOption[];
  selectedToppings: ToppingOption[];
  onChangeToppings: (toppings: ToppingOption[]) => void;
}

export function ToppingSelector({
  toppings,
  selectedToppings,
  onChangeToppings,
}: ToppingSelectorProps) {
  const handleToggleTopping = (topping: ToppingOption) => {
    if (selectedToppings.some((t) => t.id === topping.id)) {
      onChangeToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      onChangeToppings([...selectedToppings, topping]);
    }
  };

  if (!toppings.length) {
    return (
      <div className="space-y-2 mt-4">
        <p className="text-sm text-espresso/60">Sản phẩm này không có topping</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      <label className="text-sm font-semibold text-espresso block">
        Chọn Topping (Không bắt buộc)
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {toppings.map((topping) => {
          const isChecked = selectedToppings.some((t) => t.id === topping.id);
          return (
            <div
              key={topping.id}
              onClick={() => handleToggleTopping(topping)}
              className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium cursor-pointer transition select-none ${
                isChecked
                  ? 'border-caramel bg-caramel/10 text-caramel shadow-sm'
                  : 'border-espresso/20 bg-white text-espresso hover:bg-espresso/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleTopping(topping)}
                  className="w-4 h-4 text-caramel rounded border-espresso/30 focus:ring-caramel/50 cursor-pointer"
                />
                <span>{topping.name}</span>
              </div>
              <span className="text-xs text-espresso/50 font-normal">
                +{topping.price.toLocaleString('vi-VN')}đ
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
