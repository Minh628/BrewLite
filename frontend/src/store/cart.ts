import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '@/lib/api';

export type CartLine = Product & {
  quantity: number;
  size: 'S' | 'M' | 'L';
  toppings: Array<{ id: number; name: string; price: number }>;
  unitPrice: number;
};

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, 'quantity'>) => void;
  updateQty: (
    productId: number,
    size: 'S' | 'M' | 'L',
    toppings: CartLine['toppings'],
    qty: number,
  ) => void;
  remove: (productId: number, size: 'S' | 'M' | 'L', toppings: CartLine['toppings']) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

function cartKey(line: Omit<CartLine, 'quantity'>): string {
  const toppingIds = line.toppings
    .map((t) => t.id)
    .sort()
    .join(',');
  return `${line.id}-${line.size}-${toppingIds}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line) =>
        set((state) => {
          const key = cartKey(line);
          const existingIndex = state.lines.findIndex((l) => cartKey(l) === key);
          if (existingIndex >= 0) {
            return {
              lines: state.lines.map((l, i) =>
                i === existingIndex ? { ...l, quantity: Math.min(l.quantity + 1, 20) } : l,
              ),
            };
          }
          return { lines: [...state.lines, { ...line, quantity: 1 }] };
        }),
      updateQty: (productId, size, toppings, qty) =>
        set((state) => {
          const key = cartKey({ id: productId, size, toppings } as Omit<CartLine, 'quantity'>);
          if (qty <= 0) {
            return { lines: state.lines.filter((l) => cartKey(l) !== key) };
          }
          return {
            lines: state.lines.map((l) =>
              cartKey(l) === key ? { ...l, quantity: Math.min(qty, 20) } : l,
            ),
          };
        }),
      remove: (productId, size, toppings) =>
        set((state) => {
          const key = cartKey({ id: productId, size, toppings } as Omit<CartLine, 'quantity'>);
          return { lines: state.lines.filter((l) => cartKey(l) !== key) };
        }),
      clear: () => set({ lines: [] }),
      total: () => get().lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
      count: () => get().lines.reduce((sum, line) => sum + line.quantity, 0),
    }),
    {
      name: 'brewlite-cart',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);
