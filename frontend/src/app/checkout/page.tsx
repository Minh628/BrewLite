
'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { createOrder } from '@/lib/api';

function formatPrice(price: number) {
  return `${price.toLocaleString('vi-VN')} ₫`;
}

function isValidVietnamPhone(phone: string) {
  // Cho phép khoảng trắng, dấu chấm và dấu gạch ngang.
  const normalized = phone.replace(/[\s.-]/g, '');

  // Số di động Việt Nam gồm 10 chữ số bắt đầu bằng 0,
  // hoặc mã quốc gia +84 theo sau bởi 9 chữ số.
  return /^(0[35789]\d{8}|\+84[35789]\d{8})$/.test(normalized);
}

export default function CheckoutPage() {
  const router = useRouter();
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const lines = useCart((state) => state.lines);
  const total = useCart((state) => state.total());
  const clear = useCart((state) => state.clear);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent('/checkout')}`);
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidVietnamPhone(phone)) {
      setPhoneError(
        'Số điện thoại chưa hợp lệ. Hãy nhập số di động Việt Nam, ví dụ 0912345678 hoặc +84912345678.',
      );
      setMessage('');
      return;
    }

    setPhoneError('');
    setSubmitting(true);

    try {
      const result = await createOrder(
        lines.map((line) => ({
          productId: line.id,
          size: line.size,
          quantity: line.quantity,
          toppingIds: line.toppings.map((topping) => topping.id),
        })),
      );
      clear();
      router.push(`/order/${result.orderId}`);
    } catch {
      setMessage('Đặt hàng thất bại. Vui lòng thử lại.');
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) return null;

  if (lines.length === 0) {
    return (
      <main className="min-h-screen bg-crema px-4 py-10 text-espresso sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-espresso/10 bg-white p-8 text-center">
          <h1 className="text-2xl font-black">Giỏ hàng đang trống</h1>

          <p className="mt-3 text-sm text-espresso/60">
            Hãy chọn món trước khi thanh toán nhé!
          </p>

          <Link
            href="/products"
            className="mt-6 inline-flex rounded-full bg-espresso px-6 py-3 font-bold text-crema hover:opacity-90"
          >
            Khám phá menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-crema px-4 py-10 text-espresso sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/cart"
          className="text-sm font-medium text-espresso/70 hover:text-espresso"
        >
          ← Quay lại giỏ hàng
        </Link>

        <h1 className="mt-4 text-3xl font-black">Thanh toán</h1>

        <p className="mt-2 text-sm text-espresso/60">
          Điền thông tin nhận hàng để tiếp tục.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]"
        >
          <section className="space-y-5 rounded-2xl border border-espresso/10 bg-white p-5 sm:p-7">
            <h2 className="text-xl font-bold">Thông tin nhận hàng</h2>

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold"
              >
                Họ và tên
              </label>

              <input
                id="name"
                name="name"
                autoComplete="name"
                required
                maxLength={100}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setMessage('');
                }}
                className="w-full rounded-xl border border-espresso/20 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-espresso"
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold"
              >
                Số điện thoại
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                maxLength={20}
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setPhoneError('');
                  setMessage('');
                }}
                aria-invalid={Boolean(phoneError)}
                aria-describedby={
                  phoneError ? 'phone-error' : 'phone-hint'
                }
                className={`w-full rounded-xl border px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-espresso ${
                  phoneError ? 'border-red-600' : 'border-espresso/20'
                }`}
                placeholder="0912345678"
              />

              {phoneError ? (
                <p
                  id="phone-error"
                  role="alert"
                  className="mt-2 text-sm text-red-600"
                >
                  {phoneError}
                </p>
              ) : (
                <p
                  id="phone-hint"
                  className="mt-2 text-xs text-espresso/60"
                >
                  Nhập số di động Việt Nam, ví dụ 0912345678.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-semibold"
              >
                Địa chỉ giao hàng
              </label>

              <textarea
                id="address"
                name="address"
                autoComplete="street-address"
                required
                maxLength={300}
                rows={3}
                value={address}
                onChange={(event) => {
                  setAddress(event.target.value);
                  setMessage('');
                }}
                className="w-full resize-y rounded-xl border border-espresso/20 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-espresso"
                placeholder="Số nhà, đường, phường/xã..."
              />
            </div>

            <div>
              <label
                htmlFor="note"
                className="mb-2 block text-sm font-semibold"
              >
                Ghi chú (không bắt buộc)
              </label>

              <textarea
                id="note"
                name="note"
                maxLength={500}
                rows={2}
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setMessage('');
                }}
                className="w-full resize-y rounded-xl border border-espresso/20 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-espresso"
                placeholder="Ghi chú cho đơn hàng..."
              />
            </div>
          </section>

          <aside
            aria-label="Tóm tắt đơn hàng"
            className="h-fit rounded-2xl border border-espresso/10 bg-white p-5 sm:p-6"
          >
            <h2 className="text-xl font-bold">Đơn hàng của bạn</h2>

            <ul className="mt-5 space-y-4">
              {lines.map((line) => (
                <li
                  key={line.cartId}
                  className="flex justify-between gap-4 border-b border-espresso/10 pb-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{line.name}</p>

                    <p className="mt-1 text-sm text-espresso/60">
                      Size {line.size} · SL: {line.quantity}
                    </p>

                    {line.toppings.length > 0 && (
                      <p className="mt-1 text-sm text-espresso/60">
                        Topping:{' '}
                        {line.toppings
                          .map((item) => item.name)
                          .join(', ')}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 text-right text-sm font-bold">
                    {formatPrice(line.unitPrice * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="font-bold">Tổng cộng</span>

              <span className="text-xl font-black">
                {formatPrice(total)}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-espresso px-5 py-3 font-bold text-crema transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Đang đặt hàng...' : 'Đặt hàng'}
            </button>

            <p className="mt-3 text-xs leading-5 text-espresso/50">
              Đơn hàng được tạo với trạng thái PENDING. Giá được máy chủ tính
              lại khi đặt hàng.
            </p>

            {message && (
              <p
                role="status"
                aria-live="polite"
                className="mt-4 rounded-xl bg-crema p-3 text-sm leading-5"
              >
                {message}
              </p>
            )}
          </aside>
        </form>
      </div>
    </main>
  );
}
