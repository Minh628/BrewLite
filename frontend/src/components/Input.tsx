'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  loading?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, loading, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-espresso mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          disabled={props.disabled || loading}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          className={`
            w-full px-4 py-3 rounded-lg border bg-white text-espresso placeholder-espresso/40
            transition-colors duration-150
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-espresso/20 focus:border-caramel focus:ring-caramel/20'}
            ${props.disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-espresso/30'}
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${className}
          `}
          {...props}
        />
        {error && (
          <p id={`${props.id}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
