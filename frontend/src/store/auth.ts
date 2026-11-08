'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type User = {
  id: number;
  email: string;
  role?: string;
};

type AuthState = {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  hydrate: () => void;
  setHasHydrated: (state: boolean) => void;
};

function setAuthCookie(token: string | null) {
  if (typeof window !== 'undefined') {
    if (token) {
      document.cookie = `brewlite-auth=${token}; path=/; max-age=3600; SameSite=Lax`;
    } else {
      document.cookie = 'brewlite-auth=; path=/; max-age=0; SameSite=Lax';
    }
  }
}

function getAuthCookie(): string | null {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )brewlite-auth=([^;]*)/);
  return match ? match[1] : null;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (token: string, user: User) => {
        setAuthCookie(token);
        set({ accessToken: token, user, isAuthenticated: true });
      },

      clearAuth: () => {
        setAuthCookie(null);
        set({ accessToken: null, user: null, isAuthenticated: false });
      },

      setHasHydrated: (hasHydrated: boolean) => {
        set({ hasHydrated });
      },

      hydrate: () => {
        const cookieToken = getAuthCookie();
        const state = get();
        const hasAuth = !!state.accessToken && !!state.user;
        if (cookieToken && !state.accessToken) {
          set({ accessToken: cookieToken, isAuthenticated: !!state.user });
        } else {
          set({ isAuthenticated: hasAuth });
        }
      },
    }),
    {
      name: 'brewlite-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
      // Khi Zustand nạp xong dữ liệu từ localStorage, đánh dấu hasHydrated = true
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          state.hydrate();
        }
      },
    },
  ),
);
