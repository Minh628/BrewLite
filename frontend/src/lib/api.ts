import type { ApiErrorBody, Product, ProductDetail, Topping } from './types';

export type { Product, ProductDetail, Topping };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.', 0);
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

export function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>('/products');
}

export function getProductById(id: number | string): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`/products/${id}`);
}

export function getToppings(): Promise<Topping[]> {
  return apiFetch<Topping[]>('/toppings');
}
