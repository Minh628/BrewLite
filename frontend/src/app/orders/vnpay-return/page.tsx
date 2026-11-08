'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { useCart } from '@/store/cart';

interface VnpayReturnState {
  loading: boolean;
  isSuccess: boolean;
  orderId: number | null;
  method: string | null;
  message: string;
}

function VnpayReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCart((s) => s.clear);

  const [state, setState] = useState<VnpayReturnState>({
    loading: true,
    isSuccess: false,
    orderId: null,
    method: null,
    message: 'Đang xác thực giao dịch từ cổng thanh toán VNPay...',
  });

  useEffect(() => {
    let isCancelled = false;

    const verifyPayment = async () => {
      try {
        const queryString = searchParams.toString();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/payments/vnpay/return?${queryString}`);
        const data = await res.json();

        if (isCancelled) return;

        if (data.isValid && data.isSuccess) {
          // Xóa giỏ hàng khi xác nhận thanh toán thành công
          clearCart();
          // Dọn sạch session thanh toán trong sessionStorage để tránh kẹt đơn cũ khi khách mua tiếp
          if (typeof window !== 'undefined') {
            Object.keys(sessionStorage).forEach((key) => {
              if (key.startsWith('brewlite-checkout:')) {
                sessionStorage.removeItem(key);
              }
            });
          }
          setState({
            loading: false,
            isSuccess: true,
            orderId: data.orderId,
            method: data.method === 'WALLET' ? 'Ví điện tử' : 'Thẻ ngân hàng',
            message: 'Thanh toán qua cổng VNPay thành công!',
          });
        } else {
          setState({
            loading: false,
            isSuccess: false,
            orderId: data.orderId ?? null,
            method: null,
            message: !data.isValid
              ? 'Chữ ký bảo mật không hợp lệ (Fail checksum)!'
              : `Giao dịch không thành công (Mã phản hồi VNPay: ${data.responseCode || '99'})`,
          });
        }
      } catch {
        if (!isCancelled) {
          setState({
            loading: false,
            isSuccess: false,
            orderId: null,
            method: null,
            message: 'Không thể kết nối tới máy chủ để xác thực giao dịch.',
          });
        }
      }
    };

    if (searchParams.toString()) {
      verifyPayment();
    } else {
      setState({
        loading: false,
        isSuccess: false,
        orderId: null,
        method: null,
        message: 'Không tìm thấy thông tin giao dịch VNPay.',
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [searchParams, clearCart]);

  if (state.loading) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-caramel border-t-transparent" />
        <p className="mt-4 text-base font-medium text-espresso/80 animate-pulse">{state.message}</p>
      </div>
    );
  }

  return (
    <main className="flex-1 py-16 px-4 bg-crema/20 min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        {state.isSuccess ? (
          <div className="rounded-3xl border border-emerald-300 bg-white p-8 text-center shadow-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700 shadow-xs">
              ✓
            </div>
            <h1 className="mt-5 text-xl md:text-2xl font-bold text-emerald-950">{state.message}</h1>
            <p className="mt-2 text-sm text-espresso/70">
              Mã đơn hàng của bạn:{' '}
              <strong className="text-espresso font-black">#{state.orderId}</strong>
            </p>
            {state.method && (
              <p className="text-xs text-espresso/60 mt-1">
                Phương thức: <span className="font-semibold text-emerald-800">{state.method}</span>
              </p>
            )}

            <div className="mt-6 pt-6 border-t border-espresso/10 space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => router.replace(`/orders/${state.orderId}`)}
              >
                Xem chi tiết & Theo dõi đơn
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full text-espresso/80"
                onClick={() => router.replace('/')}
              >
                Về trang chủ
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-rose-300 bg-white p-8 text-center shadow-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-3xl text-rose-700 shadow-xs">
              ✕
            </div>
            <h1 className="mt-5 text-xl md:text-2xl font-bold text-rose-950">
              Thanh toán không thành công
            </h1>
            <p className="mt-2 text-sm text-rose-800/80 leading-relaxed">{state.message}</p>

            <div className="mt-6 pt-6 border-t border-espresso/10 flex flex-col gap-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => router.replace('/checkout')}
              >
                Thử thanh toán lại
              </Button>
              {state.orderId && (
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={() => router.replace(`/orders/${state.orderId}`)}
                >
                  Xem đơn hàng #{state.orderId}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VnpayReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md py-24 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-caramel border-t-transparent" />
          <p className="mt-4 text-base font-medium text-espresso/80">Đang tải...</p>
        </div>
      }
    >
      <VnpayReturnContent />
    </Suspense>
  );
}
