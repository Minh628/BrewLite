'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { formatVND } from '@/lib/format';
import { Button } from '@/components/Button';

export function Header() {
  const { user, isAuthenticated, clearAuth } = useAuth();
  const { lines, total } = useCart();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    clearAuth();
    setShowUserMenu(false);
    window.location.href = '/';
  };

  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <header className="sticky top-0 z-10 border-b border-espresso/10 bg-espresso text-crema">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight">
          <span aria-hidden="true" className="text-2xl">
            ☕
          </span>
          BrewLite
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            aria-label="Xem giỏ hàng"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-crema/30 text-xl transition hover:border-crema"
          >
            🛍️
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-caramel px-1 text-xs font-bold text-espresso">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-crema/30 text-sm font-medium hover:border-crema transition-colors"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <span className="w-8 h-8 rounded-full bg-caramel/20 flex items-center justify-center text-caramel font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:block max-w-[150px] truncate">{user.email}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-espresso/10 py-2 z-50 animate-in fade-in-0 zoom-in-95">
                    <div className="px-4 py-3 border-b border-espresso/10">
                      <p className="font-semibold text-espresso truncate">{user.email}</p>
                      <p className="text-xs text-espresso/50 mt-0.5">Khách hàng</p>
                    </div>
                    <Link
                      href="/orders"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-espresso hover:bg-espresso/5"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span>📋</span>
                      Đơn hàng của tôi
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <span>🚪</span>
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-espresso hover:text-caramel transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-crema bg-caramel rounded-lg hover:bg-caramel/90 transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
