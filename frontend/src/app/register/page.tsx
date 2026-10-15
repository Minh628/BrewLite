'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { register } from '@/lib/api';
import { useAuth } from '@/store/auth';

const registerSchema = z
  .object({
    email: z.string().email('Email không đúng định dạng').min(1, 'Email không được để trống'),
    password: z.string().min(8, 'Mật khẩu phải có độ dài tối thiểu 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const returnUrl = searchParams.get('returnUrl') ?? '/checkout';

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await register(data.email, data.password);
      setAuth(result.accessToken, result.user);
      router.push(returnUrl);
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message.includes('already registered') ||
          err.message.includes('Email already registered')
        ) {
          setError('Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-espresso/10 p-8">
          <h1 className="text-2xl font-black text-center text-espresso mb-2">Tạo tài khoản mới</h1>
          <p className="text-center text-espresso/60 mb-8">Đăng ký để bắt đầu đặt đồ uống</p>

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
                {...registerForm('email')}
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
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
                {...registerForm('password')}
                error={errors.password?.message}
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-espresso mb-1.5"
              >
                Xác nhận mật khẩu
              </label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                {...registerForm('confirmPassword')}
                error={errors.confirmPassword?.message}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} loading={isLoading}>
              Tạo tài khoản
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-espresso/60">
            Đã có tài khoản?{' '}
            <Link
              href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="font-medium text-caramel hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

import { useState } from 'react';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center">Đang tải...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
