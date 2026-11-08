'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, BaristaStatus, getBaristaQueue, updateOrderStatus } from '@/lib/api';
import { OrderDetail } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { StatusBadge } from '@/components/StatusBadge';
import { formatVND } from '@/lib/format';
import { Button } from '@/components/Button';

type ColumnKey = 'PAID' | 'PREPARING' | 'READY';

const COLUMNS: Array<{
  key: ColumnKey;
  title: string;
  description: string;
  next: BaristaStatus;
  actionLabel: string;
}> = [
  {
    key: 'PAID',
    title: 'Chờ pha',
    description: 'Đã thanh toán, chờ quầy nhận',
    next: 'PREPARING',
    actionLabel: 'Nhận pha',
  },
  {
    key: 'PREPARING',
    title: 'Đang pha',
    description: 'Quầy đang pha chế',
    next: 'READY',
    actionLabel: 'Hoàn tất pha',
  },
  {
    key: 'READY',
    title: 'Sẵn sàng',
    description: 'Chờ khách lấy tại quầy',
    next: 'COMPLETED',
    actionLabel: 'Đã giao khách',
  },
];

export default function BaristaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const accessToken = useAuth((s) => s.accessToken);
  const hasHydrated = useAuth((s) => s.hasHydrated);

  const isStaff = user?.role === 'BARISTA' || user?.role === 'ADMIN';

  // Chỉ kiểm tra chuyển hướng khi Zustand đã hoàn tất nạp từ localStorage để tránh flash redirect
  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace('/login?returnUrl=/barista');
      return;
    }
    if (user && !isStaff) {
      router.replace('/login?returnUrl=/barista&forbidden=1');
    }
  }, [hasHydrated, isAuthenticated, isStaff, user, router]);

  const {
    data: orders,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<OrderDetail[], Error>({
    queryKey: ['barista-queue', accessToken],
    queryFn: getBaristaQueue,
    enabled: hasHydrated && isAuthenticated && isStaff,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: BaristaStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barista-queue'] });
    },
  });

  const grouped = useMemo(() => {
    const buckets: Record<ColumnKey, OrderDetail[]> = {
      PAID: [],
      PREPARING: [],
      READY: [],
    };
    for (const order of orders ?? []) {
      if (order.status in buckets) {
        buckets[order.status as ColumnKey].push(order);
      }
    }
    return buckets;
  }, [orders]);

  if (!hasHydrated || !isAuthenticated || !user || !isStaff) {
    return (
      <main className="flex-1 py-12 px-4 bg-crema/30 min-h-screen">
        <p className="mx-auto max-w-md text-center text-sage">Đang kiểm tra quyền truy cập…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 py-8 px-4 bg-crema/30 min-h-screen">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-espresso">Quầy pha chế</h1>
            <p className="text-sm text-sage">
              Đăng nhập: <strong>{user.email}</strong> · {user.role} · Tự làm mới mỗi 10s
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <Link
              href="/menu"
              className="rounded-full border border-espresso/20 bg-white px-4 py-2 text-sm font-medium text-espresso hover:bg-caramel/10"
            >
              ← Về trang khách
            </Link>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full border border-espresso/20 bg-white px-4 py-2 text-sm font-medium text-espresso hover:bg-caramel/10"
            >
              Làm mới ngay
            </button>
          </div>
        </header>

        {isError && (
          <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-900">
            Lỗi tải hàng đợi: {error.message}
          </div>
        )}

        {mutation.isError && (
          <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-900">
            Lỗi chuyển trạng thái:{' '}
            {mutation.error instanceof ApiError
              ? mutation.error.message
              : ((mutation.error as Error)?.message ?? 'Không xác định')}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = grouped[col.key];
            return (
              <section
                key={col.key}
                className="flex flex-col rounded-2xl border border-espresso/10 bg-white/70 p-4 shadow-sm"
              >
                <header className="mb-3 flex items-baseline justify-between border-b border-espresso/10 pb-2">
                  <div>
                    <h2 className="text-lg font-bold text-espresso">{col.title}</h2>
                    <p className="text-xs text-sage">{col.description}</p>
                  </div>
                  <span className="rounded-full bg-caramel/20 px-3 py-1 text-sm font-semibold text-espresso">
                    {items.length}
                  </span>
                </header>

                <div className="flex flex-col gap-3">
                  {isLoading && items.length === 0 ? (
                    <div className="h-20 animate-pulse rounded-lg bg-espresso/5" />
                  ) : items.length === 0 ? (
                    <p className="py-8 text-center text-sm text-sage">
                      Chưa có đơn ở trạng thái này
                    </p>
                  ) : (
                    items.map((order) => (
                      <article
                        key={order.orderId}
                        className="rounded-xl border border-espresso/10 bg-white p-3 shadow-sm"
                      >
                        <header className="mb-2 flex items-start justify-between">
                          <div>
                            <div className="font-bold text-espresso">{order.code}</div>
                            <div className="text-xs text-sage">
                              {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                          <StatusBadge status={order.status} compact className="text-xs" />
                        </header>

                        <ul className="mb-3 space-y-1 text-sm text-espresso">
                          {order.items.map((item, idx) => (
                            <li key={`${order.orderId}-${idx}`}>
                              <span className="font-medium">
                                {item.qty}× {item.productName}
                              </span>{' '}
                              <span className="text-sage">({item.size})</span>
                              {item.toppings.length > 0 && (
                                <div className="ml-4 text-xs text-sage">
                                  + {item.toppings.map((t) => t.name).join(', ')}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>

                        <div className="mb-3 flex items-center justify-between text-sm">
                          <span className="text-sage">Tổng</span>
                          <span className="font-bold text-caramel">{formatVND(order.total)}</span>
                        </div>

                        <Button
                          onClick={() => mutation.mutate({ id: order.orderId, status: col.next })}
                          disabled={mutation.isPending && mutation.variables?.id === order.orderId}
                          className="w-full"
                        >
                          {mutation.isPending && mutation.variables?.id === order.orderId
                            ? 'Đang xử lý…'
                            : col.actionLabel}
                        </Button>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
