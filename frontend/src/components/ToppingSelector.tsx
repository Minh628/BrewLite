'use client';

import React from 'react';

export interface ToppingOption {
  id: string;
  name: string;
  price: number;
}

export const TOPPING_OPTIONS: ToppingOption[] = [
  { id: 't1', name: 'Trân châu đen', price: 5000 },
  { id: 't2', name: 'Trân châu trắng', price: 7000 },
  { id: 't3', name: 'Thạch trái cây', price: 6000 },
  { id: 't4', name: 'Pudding trứng', price: 8000 },
  { id: 't5', name: 'Kem Cheese', price: 10000 },
];

interface ToppingSelectorProps {
  selectedToppings: string[];
  onChangeToppings: (toppingIds: string[]) => void;
}

export default function ToppingSelector({
  selectedToppings,
  onChangeToppings,
}: ToppingSelectorProps) {
  const handleToggleTopping = (id: string) => {
    if (selectedToppings.includes(id)) {
      // Nếu đã có thì loại bỏ ra khỏi mảng
      onChangeToppings(selectedToppings.filter((item) => item !== id));
    } else {
      // Nếu chưa có thì thêm vào mảng
      onChangeToppings([...selectedToppings, id]);
    }
  };

  return (
    <div className="space-y-2 mt-4">
      <label className="text-sm font-semibold text-gray-700 block">
        Chọn Topping (Không bắt buộc)
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {TOPPING_OPTIONS.map((topping) => {
          const isChecked = selectedToppings.includes(topping.id);
          return (
            <div
              key={topping.id}
              onClick={() => handleToggleTopping(topping.id)}
              className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium cursor-pointer transition select-none ${
                isChecked
                  ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleTopping(topping.id)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>{topping.name}</span>
              </div>
              <span className="text-xs text-gray-500 font-normal">
                +{topping.price.toLocaleString('vi-VN')}đ
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}