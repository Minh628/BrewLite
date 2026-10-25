import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApiError, getApiBaseUrl, login, register } from './api';

const API_URL = process.env.API_E2E_URL ?? getApiBaseUrl();

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@brewlite.test`;
}

async function rawPost(path: string, body: unknown): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

describe.skipIf(!API_URL)('tích hợp API thật (API_E2E_URL)', () => {
  let email = '';

  beforeAll(() => {
    email = uniqueEmail();
  });

  afterAll(() => {
    email = '';
  });

  it('đăng ký tài khoản mới trả 201 kèm accessToken và không lộ passwordHash', async () => {
    const result = await register(email, '12345678');

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.user.email).toBe(email);
    expect(JSON.stringify(result)).not.toContain('passwordHash');
  });

  it('đăng nhập bằng tài khoản vừa đăng ký trả 200 và accessToken', async () => {
    const result = await login(email, '12345678');

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.expiresIn).toBe(3600);
    expect(result.user.email).toBe(email);
  });

  it('đăng nhập sai mật khẩu trả 401', async () => {
    const error = await login(email, 'sai-mat-khau').catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
  });

  it('đăng ký trùng email trả 409', async () => {
    const error = await register(email, '12345678').catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).message).toBe('Email already registered');
  });

  it('đăng ký với mật khẩu ngắn trả 400 đúng định dạng lỗi chung', async () => {
    const { status, body } = await rawPost('/auth/register', {
      email: uniqueEmail(),
      password: '123',
    });

    expect(status).toBe(400);
    const payload = body as { statusCode: number; message: string | string[]; path: string };
    expect(payload.statusCode).toBe(400);
    expect(Array.isArray(payload.message) ? payload.message.join(' ') : payload.message).toContain(
      'Mật khẩu phải có độ dài tối thiểu 8 ký tự',
    );
    expect(payload.path).toBe('/auth/register');
  });
});
