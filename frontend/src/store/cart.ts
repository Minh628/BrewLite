import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from 'zustand/middleware';
import type { Product } from '@/lib/api';
import { CartStorageSchema } from './cart-schema';

export type CartTopping = {
  id: number;
  name: string;
  price: number;
};

export type CartLine = Product & {
  cartId: string;
  size: 'S' | 'M' | 'L';
  sizeExtra: number;
  toppings: CartTopping[];
  quantity: number;
  unitPrice: number;
};

export type CartItemInput = {
  product: Product;
  size: 'S' | 'M' | 'L';
  sizeExtra: number;
  toppings: CartTopping[];
};

type CartState = {
  lines: CartLine[];
  add: (item: CartItemInput) => void;
  increase: (cartId: string) => void;
  decrease: (cartId: string) => void;
  remove: (cartId: string) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

const CART_VERSION = 1;

function getCartId(item: CartItemInput) {
  const toppingIds = item.toppings
    .map((topping) => topping.id)
    .sort()
    .join(',');

  return `${item.product.id}-${item.size}-${toppingIds}`;
}

// Kiểm tra JSON và schema trước khi Zustand đọc dữ liệu.
const safeCartStorage: StateStorage = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      if (raw === null) return null;

      const parsed: unknown = JSON.parse(raw);
      const result = CartStorageSchema.safeParse(parsed);

      if (!result.success || result.data.version !== CART_VERSION) {
        localStorage.removeItem(name);
        return null;
      }

      return raw;
    } catch {
      try {
        localStorage.removeItem(name);
      } catch {
        // Bỏ qua lỗi truy cập storage.
      }
      return null;
    }
  },

  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Không để lỗi storage làm ứng dụng bị crash.
    }
  },

  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Bỏ qua lỗi truy cập storage.
    }
  },
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],

      add: (item) =>
        set((state) => {
          const cartId = getCartId(item);
          const existing = state.lines.find(
            (line) => line.cartId === cartId,
          );

          if (existing) {
            if (existing.quantity >= 20) return state;

            return {
              lines: state.lines.map((line) =>
                line.cartId === cartId
                  ? { ...line, quantity: line.quantity + 1 }
                  : line,
              ),
            };
          }

          const toppings = [...item.toppings];
          const unitPrice =
            item.product.price +
            item.sizeExtra +
            toppings.reduce((sum, topping) => sum + topping.price, 0);

          return {
            lines: [
              ...state.lines,
              {
                ...item.product,
                cartId,
                size: item.size,
                sizeExtra: item.sizeExtra,
                toppings,
                quantity: 1,
                unitPrice,
              },
            ],
          };
        }),

      increase: (cartId) =>
        set((state) => ({
          lines: state.lines.map((line) =>
            line.cartId === cartId && line.quantity < 20
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          ),
        })),

      decrease: (cartId) =>
        set((state) => ({
          lines: state.lines
            .map((line) =>
              line.cartId === cartId
                ? { ...line, quantity: line.quantity - 1 }
                : line,
            )
            .filter((line) => line.quantity > 0),
        })),

      remove: (cartId) =>
        set((state) => ({
          lines: state.lines.filter((line) => line.cartId !== cartId),
        })),

      clear: () => set({ lines: [] }),

      total: () =>
        get().lines.reduce(
          (sum, line) => sum + line.unitPrice * line.quantity,
          0,
        ),

      count: () =>
        get().lines.reduce((sum, line) => sum + line.quantity, 0),
    }),
    {
      name: 'brewlite-cart',
      version: CART_VERSION,
      storage: createJSONStorage(() => safeCartStorage),
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);
