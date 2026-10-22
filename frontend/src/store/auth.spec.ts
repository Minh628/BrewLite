import { beforeEach, describe, expect, it } from 'vitest';
import { useAuth } from './auth';

const TEST_USER = { id: 'user-1', email: 'test@brewlite.com' };
const TEST_TOKEN = 'header.payload.signature';

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const key = cookie.split('=')[0].trim();
    if (key) {
      document.cookie = `${key}=; path=/; max-age=0`;
    }
  });
}

describe('useAuth store', () => {
  beforeEach(() => {
    localStorage.clear();
    clearCookies();
    useAuth.setState({ accessToken: null, user: null, isAuthenticated: false });
  });

  it('trạng thái đầu tiên là chưa đăng nhập', () => {
    const state = useAuth.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setAuth lưu token, user và đặt cookie cho middleware', () => {
    useAuth.getState().setAuth(TEST_TOKEN, TEST_USER);

    const state = useAuth.getState();
    expect(state.accessToken).toBe(TEST_TOKEN);
    expect(state.user).toEqual(TEST_USER);
    expect(state.isAuthenticated).toBe(true);
    expect(readCookie('brewlite-auth')).toBe(TEST_TOKEN);
  });

  it('setAuth ghi token vào localStorage để F5 vẫn còn phiên', () => {
    useAuth.getState().setAuth(TEST_TOKEN, TEST_USER);

    const persisted = JSON.parse(localStorage.getItem('brewlite-auth') ?? '{}');
    expect(persisted.state).toEqual({ accessToken: TEST_TOKEN, user: TEST_USER });
  });

  it('clearAuth xóa token, user và cookie', () => {
    useAuth.getState().setAuth(TEST_TOKEN, TEST_USER);
    useAuth.getState().clearAuth();

    const state = useAuth.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(readCookie('brewlite-auth')).toBeNull();
  });

  it('hydrate khôi phục token từ cookie khi store chưa có token', () => {
    document.cookie = `brewlite-auth=${TEST_TOKEN}; path=/`;
    useAuth.setState({ accessToken: null, user: TEST_USER, isAuthenticated: false });

    useAuth.getState().hydrate();

    expect(useAuth.getState().accessToken).toBe(TEST_TOKEN);
    expect(useAuth.getState().isAuthenticated).toBe(true);
  });

  it('hydrate không đánh dấu đăng nhập khi thiếu user', () => {
    document.cookie = `brewlite-auth=${TEST_TOKEN}; path=/`;
    useAuth.setState({ accessToken: null, user: null, isAuthenticated: false });

    useAuth.getState().hydrate();

    expect(useAuth.getState().accessToken).toBe(TEST_TOKEN);
    expect(useAuth.getState().isAuthenticated).toBe(false);
  });

  it('hydrate tắt isAuthenticated khi chỉ có cookie mà không có user lưu trữ', () => {
    useAuth.setState({ accessToken: TEST_TOKEN, user: null, isAuthenticated: true });

    useAuth.getState().hydrate();

    expect(useAuth.getState().isAuthenticated).toBe(false);
  });

  it('hydrate giữ nguyên phiên hợp lệ đã có token và user', () => {
    useAuth.setState({ accessToken: TEST_TOKEN, user: TEST_USER, isAuthenticated: false });

    useAuth.getState().hydrate();

    expect(useAuth.getState().isAuthenticated).toBe(true);
  });
});
