'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getOrderById } from '@/lib/api';
import { formatVND } from '@/lib/format';
import type { OrderDetail } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';

/**
 * Định dạng ngày giờ đặt hàng theo chuẩn tiếng Việt
 */
function formatOrderDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Màn hình xác nhận và theo dõi đơn hàng chi tiết (Sub-task 9.3 - PB-09)
 * Route: /orders/[id]
 */
export default function OrderConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const orderId = Number(rawId);

  const { isAuthenticated, accessToken } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // Đảm bảo chỉ render logic client sau khi store đã rehydrate hoàn toàn, chống lỗi hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Kiểm tra quyền đăng nhập, nếu chưa xác thực chuyển hướng về màn hình đăng nhập
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/orders/${rawId}`)}`);
    }
  }, [isMounted, isAuthenticated, router, rawId]);

  // Truy vấn dữ liệu chi tiết đơn hàng qua TanStack Query
  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery<OrderDetail, Error>({
    queryKey: ['order', orderId, accessToken],
    queryFn: () => getOrderById(orderId),
    enabled: isMounted && isAuthenticated && !isNaN(orderId) && orderId > 0,
    retry: 1,
    // Tự động polling mỗi 5 giây khi đơn đang trong quá trình xử lý (chờ nhận/pha chế)
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'PAID' || status === 'PREPARING') {
        return 5000;
      }
      return false;
    },
  });

  // 1. Trạng thái Loading hoặc đang khởi tạo Client Component (Skeleton Loading)
  if (!isMounted || (isLoading && !order)) {
    return (
      <main className="flex-1 py-8 px-4 bg-crema/30 min-h-screen">
        <div className="mx-auto max-w-2xl space-y-6 animate-pulse">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-espresso/10 space-y-4">
            <div className="h-4 bg-espresso/10 rounded w-1/4" />
            <div className="h-8 bg-espresso/15 rounded w-1/2" />
            <div className="h-4 bg-espresso/10 rounded w-1/3" />
          </div>

          {/* Banner Skeleton */}
          <div className="h-20 bg-espresso/10 rounded-2xl" />

          {/* Items Skeleton */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-espresso/10 space-y-4">
            <div className="h-5 bg-espresso/10 rounded w-1/3 mb-4" />
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between py-3 border-b border-espresso/5">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-espresso/15 rounded w-3/4" />
                  <div className="h-3 bg-espresso/10 rounded w-1/2" />
                </div>
                <div className="h-4 bg-espresso/15 rounded w-20" />
              </div>
            ))}
          </div>

          {/* Summary Skeleton */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-espresso/10 space-y-3">
            <div className="h-4 bg-espresso/10 rounded w-full" />
            <div className="h-4 bg-espresso/10 rounded w-full" />
            <div className="h-6 bg-espresso/15 rounded w-2/3 pt-2" />
          </div>
        </div>
      </main>
    );
  }

  // 2. Trạng thái Lỗi hoặc Không tìm thấy đơn hàng (404 / Forbidden)
  if (error || !order || isNaN(orderId)) {
    return (
      <main className="flex-1 py-16 px-4 bg-crema/30 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-sm border border-espresso/10">
          <div className="h-16 w-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-rose-50 text-3xl">
            🔍
          </div>
          <h1 className="text-xl font-bold text-espresso mb-2">Không tìm thấy đơn hàng</h1>
          <p className="text-sm text-espresso/70 mb-6 leading-relaxed">
            Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn này.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" size="md" onClick={() => refetch()}>
              Thử tải lại
            </Button>
            <Link href="/" className="inline-block">
              <Button variant="primary" size="md" className="w-full">
                Về trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 3. Màn hình Chi tiết Xác nhận Đơn hàng Hợp lệ
  const isPaid = order.status === 'PAID';
  const isReady = order.status === 'READY';
  const isPaymentFailed = order.status === 'PAYMENT_FAILED';

  return (
    <main className="flex-1 py-8 px-4 bg-crema/20 min-h-screen">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header Thông tin đơn hàng */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-espresso/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-espresso/50 mb-1">
                Mã đơn hàng
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-espresso tracking-tight">
                {order.code || `#${order.orderId}`}
              </h1>
            </div>
            <StatusBadge status={order.status} className="text-sm py-1.5 px-3.5" />
          </div>

          <div className="mt-4 pt-4 border-t border-espresso/5 flex items-center justify-between text-xs sm:text-sm text-espresso/60">
            <span>Thời gian đặt:</span>
            <span suppressHydrationWarning className="font-medium text-espresso/80">
              {formatOrderDate(order.createdAt)}
            </span>
          </div>
        </section>

        {/* Dòng thông báo nổi bật (Prominent Notification Banners theo Wireframe) */}
        {isPaid && (
          <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-4 md:p-5 flex items-start sm:items-center gap-3.5 text-emerald-950 shadow-xs">
            <span aria-hidden="true" className="text-2xl flex-shrink-0">
              ☕
            </span>
            <div>
              <h2 className="font-bold text-base md:text-lg text-emerald-900 leading-snug">
                Mời quý khách tới quầy nhận nước
              </h2>
              <p className="text-xs sm:text-sm text-emerald-800/80 mt-0.5">
                Đơn hàng đã thanh toán thành công. Barista đang tiếp nhận và pha chế đồ uống cho
                bạn.
              </p>
            </div>
          </div>
        )}

        {isReady && (
          <div className="bg-teal-50 border border-teal-300 rounded-2xl p-4 md:p-5 flex items-start sm:items-center gap-3.5 text-teal-950 shadow-xs">
            <span aria-hidden="true" className="text-2xl flex-shrink-0">
              🎉
            </span>
            <div>
              <h2 className="font-bold text-base md:text-lg text-teal-900 leading-snug">
                Đồ uống đã sẵn sàng!
              </h2>
              <p className="text-xs sm:text-sm text-teal-800/80 mt-0.5">
                Mời quý khách vui lòng tới quầy pha chế xuất trình mã đơn hàng để nhận món.
              </p>
            </div>
          </div>
        )}

        {isPaymentFailed && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 md:p-5 flex items-start sm:items-center gap-3.5 text-rose-950 shadow-xs">
            <span aria-hidden="true" className="text-2xl flex-shrink-0">
              ⚠️
            </span>
            <div>
              <h2 className="font-bold text-base text-rose-900 leading-snug">
                Thanh toán không thành công
              </h2>
              <p className="text-xs sm:text-sm text-rose-800/80 mt-0.5">
                Giao dịch thanh toán chưa thể hoàn tất. Quý khách có thể kiểm tra lại số dư thẻ hoặc
                ví điện tử.
              </p>
            </div>
          </div>
        )}

        {/* Danh sách các món ăn đã đặt */}
        <section className="bg-white rounded-2xl shadow-sm border border-espresso/10 overflow-hidden">
          <div className="px-6 py-4 bg-espresso/5 border-b border-espresso/10 flex items-center justify-between">
            <h2 className="font-bold text-espresso text-base">Danh sách món đã đặt</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-espresso/10 text-espresso">
              {order.items.reduce((acc, curr) => acc + curr.qty, 0)} món
            </span>
          </div>

          <div className="divide-y divide-espresso/10 p-6 space-y-4 divide-y-0">
            {order.items.map((item, idx) => (
              <div
                key={`${item.productId}-${item.size}-${idx}`}
                className="flex items-start justify-between gap-4 pb-4 border-b border-espresso/5 last:border-b-0 last:pb-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-espresso text-sm md:text-base">
                      {item.productName}
                    </h3>
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-espresso/5 text-espresso/70">
                      Size {item.size}
                    </span>
                  </div>

                  {item.toppings && item.toppings.length > 0 && (
                    <p className="text-xs text-espresso/60 mt-1">
                      Topping:{' '}
                      {item.toppings
                        .map((t) => `${t.name}${t.price > 0 ? ` (+${formatVND(t.price)})` : ''}`)
                        .join(', ')}
                    </p>
                  )}

                  <p className="text-xs text-espresso/50 mt-1">
                    Số lượng: <span className="font-medium text-espresso">{item.qty}</span> ×{' '}
                    {formatVND(item.unitPrice)}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-caramel text-sm md:text-base">
                    {formatVND(item.lineTotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tóm tắt thanh toán & Khuyến mãi */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-espresso/10 space-y-4">
          <h2 className="font-bold text-espresso text-base border-b border-espresso/10 pb-3">
            Tóm tắt thanh toán
          </h2>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-espresso/70">
              <span>Tạm tính (Subtotal)</span>
              <span className="font-medium text-espresso">{formatVND(order.subtotal)}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span className="flex items-center gap-1.5">
                  <span>Giảm giá khuyến mãi</span>
                  {order.promoCode && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {order.promoCode}
                    </span>
                  )}
                </span>
                <span className="font-semibold">-{formatVND(order.discount)}</span>
              </div>
            )}

            <div className="flex justify-between text-espresso/70">
              <span>Phương thức thanh toán</span>
              <span className="font-medium text-espresso">
                {order.payment?.method === 'CARD'
                  ? `Thẻ ngân hàng (•••• ${order.payment.cardLast4 || '****'})`
                  : order.payment?.method === 'WALLET'
                    ? 'Ví điện tử BrewLite'
                    : order.payment?.method ||
                      (order.status === 'PENDING' ? 'Chờ thanh toán' : 'Chưa ghi nhận')}
              </span>
            </div>

            <div className="flex justify-between text-espresso/70 items-center">
              <span>Điểm thưởng tích lũy</span>
              <span className="inline-flex items-center gap-1 font-semibold text-caramel">
                <span aria-hidden="true">⭐</span>
                <span>+{order.pointsEarned} điểm</span>
              </span>
            </div>

            <div className="pt-3 border-t border-espresso/10 flex justify-between items-baseline">
              <span className="font-bold text-base text-espresso">Tổng thanh toán</span>
              <span className="text-xl md:text-2xl font-black text-caramel-strong">
                {formatVND(order.total)}
              </span>
            </div>
          </div>
        </section>

        {/* Nút hành động & Điều hướng */}
        <section className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              Về trang chủ
            </Button>
          </Link>
          <Link href="/orders" className="flex-1">
            <Button variant="primary" size="lg" className="w-full">
              Xem đơn của tôi
            </Button>
          </Link>
        </section>
      </div>
    </main>
  );
}
