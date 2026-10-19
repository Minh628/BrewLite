'use client';

import React from 'react';

export type SizeCode = 'S' | 'M' | 'L';

export interface AvailableSize {
  size: SizeCode;
  extraPrice: number;
}

interface SizeSelectorProps {
  sizes: AvailableSize[];
  selectedSize: SizeCode;
  onChangeSize: (size: SizeCode) => void;
}

export default function SizeSelector({ sizes, selectedSize, onChangeSize }: SizeSelectorProps) {
  const SIZE_NAMES: Record<SizeCode, string> = {
    S: 'Nhỏ (S)',
    M: 'Vừa (M)',
    L: 'Lớn (L)',
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-espresso block">
        Chọn Size <span className="text-caramel">*</span>
      </label>
      <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Chọn kích thước">
        {sizes.map((size) => {
          const isSelected = selectedSize === size.size;
          return (
            <button
              key={size.size}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChangeSize(size.size)}
              className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition flex flex-col items-center justify-center gap-0.5 focus:outline-none focus:ring-2 focus:ring-caramel/50 ${
                isSelected
                  ? 'border-caramel bg-caramel/10 text-caramel font-semibold shadow-sm'
                  : 'border-espresso/20 bg-white text-espresso hover:bg-espresso/5'
              }`}
            >
              <span>{SIZE_NAMES[size.size]}</span>
              <span className="text-xs text-espresso/50">
                {size.extraPrice > 0 ? `+${size.extraPrice.toLocaleString('vi-VN')}đ` : 'Gốc'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
