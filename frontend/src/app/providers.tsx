'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { setAuthTokenGetter } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Toast } from '@/hooks/Toast';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(() => new QueryClient());
  const { accessToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
        console.error('Không thể đăng ký service worker BrewLite:', error);
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toast />
    </QueryClientProvider>
  );
}
