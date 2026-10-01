import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductDetailDto, ProductDto, ToppingDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProductDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        category: { isActive: true },
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        isActive: true,
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });

    return products.map(({ isActive, ...product }) => ({
      ...product,
      isAvailable: isActive,
    }));
  }

  async findOne(id: string): Promise<ProductDetailDto> {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        isActive: true,
        category: { isActive: true },
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        isActive: true,
        category: {
          select: { id: true, name: true },
        },
        sizes: {
          select: { size: true, extraPrice: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const sizeOrder = ['S', 'M', 'L'];

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      isAvailable: product.isActive,
      sizes: product.sizes
        .map(({ size, extraPrice }) => ({ code: size as 'S' | 'M' | 'L', extra: extraPrice }))
        .sort((left, right) => sizeOrder.indexOf(left.code) - sizeOrder.indexOf(right.code)),
    };
  }

  async findAllToppings(): Promise<ToppingDto[]> {
    return this.prisma.topping.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true },
      orderBy: { name: 'asc' },
    });
  }
}
