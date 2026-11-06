import type { Product } from '../types';

export const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Cà phê sữa',
    price: 35000,
    imageUrl: '/images/ca-phe-sua.jpg',
    category: { id: 1, name: 'Cà phê' },
    isAvailable: true,
  },
  {
    id: 2,
    name: 'Americano',
    price: 40000,
    imageUrl: '/images/americano.jpg',
    category: { id: 1, name: 'Cà phê' },
    isAvailable: true,
  },
  {
    id: 3,
    name: 'Cappuccino',
    price: 45000,
    imageUrl: '/images/cappuccino.jpg',
    category: { id: 1, name: 'Cà phê' },
    isAvailable: true,
  },
  {
    id: 4,
    name: 'Latte',
    price: 45000,
    imageUrl: '/images/latte.jpg',
    category: { id: 1, name: 'Cà phê' },
    isAvailable: true,
  },
  {
    id: 5,
    name: 'Trà đào',
    price: 39000,
    imageUrl: '/images/tra-dao.jpg',
    category: { id: 2, name: 'Trà' },
    isAvailable: true,
  },
  {
    id: 6,
    name: 'Trà vải',
    price: 39000,
    imageUrl: '/images/tra-vai.jpg',
    category: { id: 2, name: 'Trà' },
    isAvailable: true,
  },
  {
    id: 7,
    name: 'Trà đào cam sả',
    price: 42000,
    imageUrl: '/images/tra-dao-cam-sa.jpg',
    category: { id: 2, name: 'Trà' },
    isAvailable: true,
  },
  {
    id: 8,
    name: 'Matcha đá xay',
    price: 49000,
    imageUrl: '/images/matcha-da-xay.jpg',
    category: { id: 3, name: 'Đá xay' },
    isAvailable: true,
  },
];

export function fetchMockProducts(): Promise<Product[]> {
  return new Promise((resolve) => setTimeout(() => resolve(mockProducts), 400));
}
