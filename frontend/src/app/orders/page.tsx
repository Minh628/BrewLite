'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getMyOrders } from '@/lib/api';
import { formatVND } from '@/lib/format';
import type { PaginatedOrders } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';

function formatOrderDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push('/login?returnUrl=/orders');
    }
  }, [isMounted, isAuthenticated, router]);

  const { data, isLoading, error } = useQuery<PaginatedOrders, Error>({
    queryKey: ['myOrders', page, accessToken],
    queryFn: () => getMyOrders(page, limit),
    enabled: isMounted && isAuthenticated,
    retry: 1,
  });

  if (!isMounted || (isLoading && !data)) {
    return (
      <main className="flex-1 py-8 px-4 bg-crema/30 min-h-screen">
        <div className="mx-auto max-w-2xl space-y-4 animate-pulse">
          <div className="h-8 bg-espresso/15 rounded w-1/3" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-espresso/10 space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-5 bg-espresso/15 rounded w-1/4" />
                <div className="h-5 bg-espresso/10 rounded w-1/5" />
              </div>
              <div className="h-4 bg-espresso/10 rounded w-1/3" />
              <div className="h-4 bg-espresso/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 py-16 px-4 bg-crema/30 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-sm border border-espresso/10">
          <p className="text-espresso/70 mb-6">
            Không thể tải danh sách đơn hàng. Vui lòng thử lại.
          </p>
          <Link href="/">
            <Button variant="primary" size="md">
              Về trang chủ
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const orders = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <main className="flex-1 py-8 px-4 bg-crema/20 min-h-screen">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-espresso tracking-tight">Đơn của tôi</h1>
          {data && data.totalItems > 0 && (
            <span className="text-sm text-espresso/60">{data.totalItems} đơn hàng</span>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-espresso/10">
            <div className="text-5xl mb-4">☕</div>
            <h2 className="text-lg font-bold text-espresso mb-2">Chưa có đơn hàng</h2>
            <p className="text-sm text-espresso/60 mb-6">
              Bạn chưa đặt đơn nào. Hãy khám phá menu và thưởng thức đồ uống ngay!
            </p>
            <Link href="/">
              <Button variant="primary" size="md">
                Khám phá menu
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {orders.map((order) => (
                <li key={order.orderId}>
                  <Link
                    href={`/orders/${order.orderId}`}
                    className="block bg-white rounded-2xl p-5 shadow-sm border border-espresso/10 hover:border-caramel/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="text-base font-bold text-espresso">{order.code}</span>
                      <StatusBadge status={order.status} compact className="text-xs" />
                    </div>
                    <div className="flex items-center justify-between text-sm text-espresso/70">
                      <span suppressHydrationWarning>{formatOrderDate(order.createdAt)}</span>
                      <span className="font-semibold text-espresso">{formatVND(order.total)}</span>
                    </div>
                    <p className="text-xs text-espresso/50 mt-1">{order.itemCount} món</p>
                  </Link>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Trước
                </Button>
                <span className="text-sm text-espresso/70">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Sau →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
