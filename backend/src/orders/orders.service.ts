import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { OrderPricingResult, PricingService } from '../pricing/pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatedOrderDto } from './dto/order-response.dto';

/**
 * Mã đơn hiển thị cho khách, ví dụ đơn id 1001 → "#1001"
 */
export function formatOrderCode(orderId: number): string {
  return `#${orderId}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * Tạo đơn hàng trạng thái PENDING từ giỏ hàng của người dùng (Sub-task 6.2, 6.3).
   * - Giá do PricingService tính từ DB; mọi trường giá client gửi đều bị bỏ qua
   * - Order + OrderItem + OrderItemTopping được lưu trong một transaction
   */
  async create(userId: number, dto: CreateOrderDto): Promise<CreatedOrderDto> {
    // Chỉ chuyển các trường nghiệp vụ sang PricingService, không bao giờ chuyển giá của client
    const pricing = await this.priceItems(
      dto.items.map((item) => ({
        productId: item.productId,
        size: item.size,
        qty: item.qty,
        toppingIds: item.toppingIds ?? [],
      })),
    );

    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            userId,
            status: OrderStatus.PENDING,
            total: pricing.total,
          },
        });

        for (const item of pricing.items) {
          await tx.orderItem.create({
            data: {
              orderId: created.id,
              productId: item.productId,
              size: item.size,
              qty: item.qty,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              toppings: {
                create: item.toppings.map((topping) => ({
                  toppingId: topping.toppingId,
                  price: topping.price,
                })),
              },
            },
          });
        }

        return created;
      });

      return {
        orderId: order.id,
        code: formatOrderCode(order.id),
        status: order.status,
        total: order.total,
        items: pricing.items.map((item) => ({
          productId: item.productId,
          size: item.size,
          qty: item.qty,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
        createdAt: order.createdAt.toISOString(),
      };
    } catch (error) {
      throw this.mapPrismaError(error);
    }
  }

  /**
   * Gọi PricingService; sản phẩm không tồn tại / ngừng bán trả 400 theo contract v2 thay vì 404
   */
  private async priceItems(
    items: Parameters<PricingService['calculateOrderPricing']>[0],
  ): Promise<OrderPricingResult> {
    try {
      return await this.pricingService.calculateOrderPricing(items);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * Ánh xạ lỗi Prisma sang HTTP:
   * - P2002 (vi phạm unique) → 409 Conflict
   * - P2003 (vi phạm khóa ngoại, ví dụ sản phẩm/topping/user bị xóa giữa chừng) → 400 Bad Request
   * Các lỗi khác giữ nguyên để HttpExceptionFilter trả 500.
   */
  private mapPrismaError(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return new ConflictException('Đơn hàng bị trùng dữ liệu, vui lòng thử lại');
      }
      if (error.code === 'P2003') {
        return new BadRequestException(
          'Sản phẩm, topping hoặc tài khoản trong đơn hàng không còn tồn tại',
        );
      }
    }
    return error;
  }
}
