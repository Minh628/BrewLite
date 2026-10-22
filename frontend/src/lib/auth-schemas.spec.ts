import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './auth-schemas';

type ParseResult = {
  success: boolean;
  error?: { issues: { message: string; path: PropertyKey[] }[] };
};

function firstError(result: ParseResult) {
  return result.error?.issues[0];
}

describe('registerSchema', () => {
  const valid = {
    email: 'customer@brewlite.com',
    password: '12345678',
    confirmPassword: '12345678',
  };

  it('chấp nhận dữ liệu hợp lệ', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('báo lỗi khi email rỗng', () => {
    const result = registerSchema.safeParse({ ...valid, email: '' });
    expect(result.success).toBe(false);
    expect(firstError(result)?.message).toBe('Email không đúng định dạng');
  });

  it('báo lỗi khi email sai định dạng', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'khong-phai-email' });
    expect(result.success).toBe(false);
    expect(firstError(result)?.message).toBe('Email không đúng định dạng');
  });

  it('báo lỗi khi mật khẩu ngắn hơn 8 ký tự', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: '1234567',
      confirmPassword: '1234567',
    });
    expect(result.success).toBe(false);
    expect(firstError(result)?.message).toBe('Mật khẩu phải có độ dài tối thiểu 8 ký tự');
  });

  it('báo lỗi khi xác nhận mật khẩu không khớp', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: '87654321' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['confirmPassword']);
    expect(firstError(result)?.message).toBe('Mật khẩu xác nhận không khớp');
  });

  it('báo lỗi khi bỏ trống xác nhận mật khẩu', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === 'confirmPassword')).toBe(true);
  });
});

describe('loginSchema', () => {
  it('chấp nhận email và mật khẩu hợp lệ', () => {
    expect(loginSchema.safeParse({ email: 'test@brewlite.com', password: 'x' }).success).toBe(true);
  });

  it('báo lỗi khi email sai định dạng', () => {
    const result = loginSchema.safeParse({ email: 'abc', password: '12345678' });
    expect(result.success).toBe(false);
    expect(firstError(result)?.message).toBe('Email không đúng định dạng');
  });

  it('báo lỗi khi mật khẩu để trống', () => {
    const result = loginSchema.safeParse({ email: 'test@brewlite.com', password: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['password']);
    expect(firstError(result)?.message).toBe('Mật khẩu không được để trống');
  });
});
