import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ProductsService } from '../../src/products/products.service';

describe('ProductsService', () => {
  const prisma = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    topping: {
      findMany: jest.fn(),
    },
  };
  let service: ProductsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ProductsService(prisma as unknown as PrismaService);
  });

  it('returns active products when the menu has data', async () => {
    const products = [
      {
        id: 'product-1',
        name: 'Americano',
        price: 40000,
        imageUrl: '/americano.svg',
        isActive: true,
        category: { id: 'category-coffee', name: 'Cà phê' },
      },
    ];
    prisma.product.findMany.mockResolvedValue(products);

    await expect(service.findAll()).resolves.toEqual([
      {
        id: 'product-1',
        name: 'Americano',
        price: 40000,
        imageUrl: '/americano.svg',
        category: { id: 'category-coffee', name: 'Cà phê' },
        isAvailable: true,
      },
    ]);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, category: { isActive: true } },
      }),
    );
  });

  it('returns an empty array when there are no active products', async () => {
    prisma.product.findMany.mockResolvedValue([]);

    await expect(service.findAll()).resolves.toEqual([]);
  });

  it('returns a product for a valid ID with sizes sorted by code', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: 'product-1',
      name: 'Americano',
      description: 'Cà phê đen pha loãng',
      price: 40000,
      imageUrl: '/americano.svg',
      isActive: true,
      category: { id: 'category-coffee', name: 'Cà phê' },
      sizes: [
        { size: 'L', extraPrice: 10000 },
        { size: 'S', extraPrice: 0 },
        { size: 'M', extraPrice: 5000 },
      ],
    });

    await expect(service.findOne('product-1')).resolves.toEqual({
      id: 'product-1',
      name: 'Americano',
      description: 'Cà phê đen pha loãng',
      price: 40000,
      imageUrl: '/americano.svg',
      category: { id: 'category-coffee', name: 'Cà phê' },
      isAvailable: true,
      sizes: [
        { code: 'S', extra: 0 },
        { code: 'M', extra: 5000 },
        { code: 'L', extra: 10000 },
      ],
    });
    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'product-1', isActive: true, category: { isActive: true } },
      }),
    );
  });

  it('throws 404 when the requested product ID does not exist', async () => {
    prisma.product.findFirst.mockResolvedValue(null);

    await expect(service.findOne('missing-product')).rejects.toBeInstanceOf(NotFoundException);
  });
});
