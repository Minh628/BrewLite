import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('Email không đúng định dạng').min(1, 'Email không được để trống'),
    password: z.string().min(8, 'Mật khẩu phải có độ dài tối thiểu 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng').min(1, 'Email không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export type RegisterForm = z.infer<typeof registerSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
