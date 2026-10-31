import type { ApiErrorBody, Category, Product, ProductDetail, Topping, OrderDetail } from './types';

export type { Category, Product, ProductDetail, Topping, OrderDetail };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let getAccessToken: () => string | null = () => null;

export function setAuthTokenGetter(getter: () => string | null) {
  getAccessToken = getter;
}

export function getApiBaseUrl(): string {
  return API_URL;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init?.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.', 0);
  }

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      const { useAuth } = await import('@/store/auth');
      useAuth.getState().clearAuth();
      window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
  }

  if (!response.ok) {
    let message = `Yêu cầu thất bại (${response.status}).`;
    try {
      const body = (await response.json()) as ApiErrorBody;
      message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? message);
    } catch {}
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export function getProducts(params?: { category?: number; q?: string }): Promise<Product[]> {
  const search = new URLSearchParams();
  if (params?.category !== undefined) search.set('category', String(params.category));
  if (params?.q) search.set('q', params.q);
  const query = search.toString();
  return apiFetch<Product[]>(`/products${query ? `?${query}` : ''}`);
}

export function getProductById(id: number | string): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`/products/${id}`);
}

export function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/categories');
}

export function getToppings(): Promise<Topping[]> {
  return apiFetch<Topping[]>('/toppings');
}

export async function register(
  email: string,
  password: string,
): Promise<{
  user: { id: number; email: string };
  accessToken: string;
}> {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function login(
  email: string,
  password: string,
): Promise<{
  accessToken: string;
  expiresIn: number;
  user: { id: number; email: string };
}> {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export type CreateOrderItem = {
  productId: number;
  size: 'S' | 'M' | 'L';
  qty: number;
  toppingIds: number[];
};

export async function createOrder(items: CreateOrderItem[]): Promise<{
  orderId: number;
  code: string;
  status: string;
  total: number;
}> {
  return apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

/**
 * Lấy thông tin chi tiết của một đơn hàng (Sub-task 9.1 & 9.3)
 * @param id Mã ID số của đơn hàng
 * @returns Chi tiết đơn hàng gồm các món, topping, tóm tắt thanh toán
 */
export function getOrderById(id: number | string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/orders/${id}`);
}
