import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryDto, ProductDetailDto, ProductDto, ToppingDto } from './dto/product.dto';
import { ProductsQueryDto } from './dto/products-query.dto';
import { matchesSearch } from './search-text';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Danh sách món đang bán, lọc theo danh mục và tìm theo tên (PB-18).
   * Lọc danh mục chạy trong DB; tìm tên không dấu chạy trên kết quả vì Postgres
   * không bỏ dấu tiếng Việt khi chưa cài extension unaccent, và menu chỉ vài chục món.
   */
  async findAll(query: ProductsQueryDto = {}): Promise<ProductDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        category: { isActive: true },
        ...(query.category !== undefined && { categoryId: query.category }),
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

    const keyword = query.q;

    return products
      .filter((product) => !keyword || matchesSearch(product.name, keyword))
      .map(({ isActive, ...product }) => ({
        ...product,
        isAvailable: isActive,
      }));
  }

  async findAllCategories(): Promise<CategoryDto[]> {
    return this.prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number): Promise<ProductDetailDto> {
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
