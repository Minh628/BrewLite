import type {
  ApiErrorBody,
  Category,
  Product,
  ProductDetail,
  Topping,
  OrderDetail,
  PaginatedOrders,
} from './types';

export type { Category, Product, ProductDetail, Topping, OrderDetail, PaginatedOrders };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  code?: string;
  errorBody?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, errorBody?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errorBody = errorBody;
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
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
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new ApiError('Yêu cầu đã quá thời gian chờ. Vui lòng thử lại.', 0);
    }
    throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.', 0);
  } finally {
    clearTimeout(timeout);
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
    let code: string | undefined;
    let errorBody: Record<string, unknown> | undefined;
    try {
      const body = (await response.json()) as ApiErrorBody & Record<string, unknown>;
      message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? message);
      if (typeof body.code === 'string') code = body.code;
      errorBody = body as Record<string, unknown>;
    } catch {}
    throw new ApiError(message, response.status, code, errorBody);
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
  user: { id: number; email: string; role: string };
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
  user: { id: number; email: string; role: string };
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

export async function createOrder(
  items: CreateOrderItem[],
  idempotencyKey?: string,
  promoCode?: string,
): Promise<{
  orderId: number;
  code: string;
  status: string;
  total: number;
  subtotal?: number;
  discount?: number;
}> {
  return apiFetch('/orders', {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    body: JSON.stringify({
      items,
      ...(promoCode ? { promoCode } : {}),
    }),
  });
}

export type ValidatedPromotion = {
  code: string;
  discount: number;
};

export async function validatePromotion(
  code: string,
  subtotal: number,
): Promise<ValidatedPromotion> {
  return apiFetch<ValidatedPromotion>('/promotions/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  });
}

export type PaymentMethod = 'CARD' | 'WALLET';

export type PaymentResult = {
  orderId: number;
  amount: number;
  method: PaymentMethod;
  status: 'PAID' | 'PAYMENT_FAILED';
  cardLast4?: string | null;
  failureReason?: string | null;
};

export function createPayment(
  orderId: number,
  method: PaymentMethod,
  idempotencyKey: string,
  cardNumber?: string,
): Promise<PaymentResult> {
  return apiFetch('/payments', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ orderId, method, ...(cardNumber ? { cardNumber } : {}) }),
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

export function getMyOrders(page = 1, limit = 10): Promise<PaginatedOrders> {
  return apiFetch<PaginatedOrders>(`/orders/me?page=${page}&limit=${limit}`);
}

/**
 * Hàng đợi quầy pha chế — PB-32a (yêu cầu role BARISTA/ADMIN).
 * Trả tất cả đơn ở PAID/PREPARING/READY, cũ nhất trước.
 */
export function getBaristaQueue(): Promise<OrderDetail[]> {
  return apiFetch<OrderDetail[]>('/orders/queue');
}

export type BaristaStatus = 'PREPARING' | 'READY' | 'COMPLETED';

/**
 * Quầy chuyển trạng thái đơn — Sub-task 10.1c.
 * State Machine: PAID → PREPARING → READY → COMPLETED.
 */
export function updateOrderStatus(
  id: number,
  status: BaristaStatus,
): Promise<{ orderId: number; code: string; status: string }> {
  return apiFetch(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
