import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductDto } from './dto/product.dto';

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
}
