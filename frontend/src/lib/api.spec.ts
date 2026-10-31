import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getOrderById, login, register, setAuthTokenGetter } from './api';
import { useAuth } from '@/store/auth';

type FetchArgs = { url: string; init: RequestInit | undefined };

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse(body, status));
}

function lastFetchArgs(spy: ReturnType<typeof vi.spyOn>): FetchArgs {
  const call = spy.mock.calls.at(-1) as unknown as [string, RequestInit | undefined];
  return { url: call[0], init: call[1] };
}

describe('api client', () => {
  beforeEach(() => {
    setAuthTokenGetter(() => null);
    useAuth.setState({ accessToken: null, user: null, isAuthenticated: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('login gửi POST /auth/login với đúng body', async () => {
    const spy = mockFetch(200, {
      accessToken: 'token',
      expiresIn: 3600,
      user: { id: 'u1', email: 'test@brewlite.com' },
    });

    const result = await login('test@brewlite.com', '12345678');

    const { url, init } = lastFetchArgs(spy);
    expect(url).toContain('/auth/login');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      email: 'test@brewlite.com',
      password: '12345678',
    });
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(result.accessToken).toBe('token');
    expect(result.user.email).toBe('test@brewlite.com');
  });

  it('gắn Authorization Bearer khi đã có token', async () => {
    setAuthTokenGetter(() => 'abc.def.ghi');
    const spy = mockFetch(201, { user: { id: 'u1', email: 'a@b.com' }, accessToken: 't' });

    await register('a@b.com', '12345678');

    const { url, init } = lastFetchArgs(spy);
    expect(url).toContain('/auth/register');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer abc.def.ghi' });
  });

  it('không gắn Authorization khi chưa đăng nhập', async () => {
    const spy = mockFetch(201, { user: { id: 'u1', email: 'a@b.com' }, accessToken: 't' });

    await register('a@b.com', '12345678');

    const { init } = lastFetchArgs(spy);
    expect(init?.headers).not.toHaveProperty('Authorization');
  });

  it('trả ApiError 401 kèm thông điệp từ server và xóa phiên', async () => {
    useAuth.getState().setAuth('old-token', { id: 1, email: 'a@b.com' });
    mockFetch(401, { statusCode: 401, message: 'Invalid email or password' });

    await expect(login('a@b.com', 'sai-mat-khau')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    });
    expect(useAuth.getState().accessToken).toBeNull();
  });

  it('trả ApiError 409 với thông điệp lỗi trùng email từ server', async () => {
    mockFetch(409, {
      statusCode: 409,
      message: 'Email already registered',
      error: 'Conflict',
      path: '/auth/register',
      timestamp: '2026-10-22T00:00:00.000Z',
    });

    const error = await register('test@brewlite.com', '12345678').catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).message).toBe('Email already registered');
  });

  it('gộp mảng message của ValidationPipe (400) thành một câu', async () => {
    mockFetch(400, {
      statusCode: 400,
      message: ['email must be an email', 'password is too short'],
    });

    const error = await register('sai', '1').catch((err: unknown) => err);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).message).toBe('email must be an email, password is too short');
  });

  it('trả ApiError 429 khi bị rate-limit đăng nhập', async () => {
    mockFetch(429, { statusCode: 429, message: 'Too Many Requests' });

    const error = await login('a@b.com', '12345678').catch((err: unknown) => err);
    expect((error as ApiError).status).toBe(429);
    expect((error as ApiError).message).toBe('Too Many Requests');
  });

  it('trả ApiError status 0 khi không kết nối được API', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await login('a@b.com', '12345678').catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
    expect((error as ApiError).message).toContain('Không kết nối được máy chủ');
  });

  it('getOrderById gửi GET /orders/:id kèm Bearer token', async () => {
    setAuthTokenGetter(() => 'test-bearer-token');
    const mockOrder = {
      orderId: 1001,
      code: '#1001',
      status: 'PAID',
      subtotal: 70000,
      discount: 0,
      total: 70000,
      pointsEarned: 7,
      createdAt: '2026-11-02T10:30:00.000Z',
      items: [],
    };
    const spy = mockFetch(200, mockOrder);

    const result = await getOrderById(1001);

    const { url, init } = lastFetchArgs(spy);
    expect(url).toContain('/orders/1001');
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer test-bearer-token',
    });
    expect(result.orderId).toBe(1001);
    expect(result.status).toBe('PAID');
  });
});
