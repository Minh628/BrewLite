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

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toast />
    </QueryClientProvider>
  );
}
