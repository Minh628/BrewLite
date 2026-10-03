'use client';

import React from 'react';

export type SizeCode = 'S' | 'M' | 'L';

interface SizeSelectorProps {
  selectedSize: SizeCode;
  onChangeSize: (size: SizeCode) => void;
}

const SIZE_OPTIONS: { code: SizeCode; name: string; extraPrice: number }[] = [
  { code: 'S', name: 'Nhỏ (S)', extraPrice: 0 },
  { code: 'M', name: 'Vừa (M)', extraPrice: 5000 },
  { code: 'L', name: 'Lớn (L)', extraPrice: 10000 },
];

export default function SizeSelector({ selectedSize, onChangeSize }: SizeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 block">
        Chọn Size <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Chọn kích thước">
        {SIZE_OPTIONS.map((size) => {
          const isSelected = selectedSize === size.code;
          return (
            <button
              key={size.code}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChangeSize(size.code)}
              className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition flex flex-col items-center justify-center gap-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{size.name}</span>
              <span className="text-xs text-gray-500">
                {size.extraPrice > 0 ? `+${size.extraPrice.toLocaleString('vi-VN')}đ` : 'Gốc'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}