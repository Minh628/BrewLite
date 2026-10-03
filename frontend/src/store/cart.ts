import { create } from 'zustand';
import type { Product } from '@/lib/api';

type CartLine = Product & { quantity: number };

type CartState = {
  lines: CartLine[];
  add: (product: Product) => void;
  remove: (productId: number) => void;
  total: () => number;
};

export const useCart = create<CartState>((set, get) => ({
  lines: [],
  add: (product) =>
    set((state) => {
      const existing = state.lines.find((line) => line.id === product.id);
      if (existing)
        return {
          lines: state.lines.map((line) =>
            line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
          ),
        };
      return { lines: [...state.lines, { ...product, quantity: 1 }] };
    }),
  remove: (productId) =>
    set((state) => ({ lines: state.lines.filter((line) => line.id !== productId) })),
  total: () => get().lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
}));
