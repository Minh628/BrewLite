'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { login } from '@/lib/api';
import { loginSchema, type LoginForm } from '@/lib/auth-schemas';
import { useAuth } from '@/store/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const returnUrl = searchParams.get('returnUrl') ?? '/checkout';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(data.email, data.password);
      setAuth(result.accessToken, result.user);
      router.push(returnUrl);
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-espresso/10 p-8">
          <h1 className="text-2xl font-black text-center text-espresso mb-2">Chào mừng quay lại</h1>
          <p className="text-center text-espresso/60 mb-8">Đăng nhập để tiếp tục đặt đồ uống</p>

          {error && (
            <div
              className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-espresso mb-1.5">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                error={errors.email?.message}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-espresso mb-1.5">
                Mật khẩu
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} loading={isLoading}>
              Đăng nhập
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-espresso/60">
            Chưa có tài khoản?{' '}
            <Link
              href={`/register?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="font-medium text-caramel hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-espresso/40">
            Tài khoản test: test@brewlite.com / 12345678
          </p>
        </div>
      </div>
    </main>
  );
}

import { useState } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center">Đang tải...</div>}>
      <LoginContent />
    </Suspense>
  );
}
