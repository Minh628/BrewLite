import React from 'react';

interface PriceTextProps {
  amount: number;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PriceText: React.FC<PriceTextProps> = ({
  amount,
  currency = 'đ',
  className = '',
  size = 'md',
}) => {
  const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);

  const sizes = {
    sm: 'text-sm font-medium',
    md: 'text-base font-semibold',
    lg: 'text-lg font-bold',
    xl: 'text-2xl font-extrabold',
  };

  return (
    <span className={`text-coffee-700 ${sizes[size]} ${className}`}>
      {formattedAmount}{currency}
    </span>
  );
};