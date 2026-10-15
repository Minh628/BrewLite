'use client';

import { create } from 'zustand';

type ToastState = {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
};

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message: string) => {
    set({ message });
    setTimeout(() => set({ message: null }), 3000);
  },
  hide: () => set({ message: null }),
}));

export const useToastActions = () => {
  const { show, hide } = useToast();
  return { show, hide };
};
