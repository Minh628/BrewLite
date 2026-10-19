import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * Tạo đơn hàng mới với cơ chế phòng vệ tự tính lại giá (Anti-Tampering).
   * QUY TẮC: Server là nguồn sự thật duy nhất (Single Source of Truth), toàn bộ trường giá client gửi bị bỏ qua.
   *
   * @param userId ID của người dùng đã xác thực qua JWT
   * @param dto Dữ liệu giỏ hàng do client gửi
   */
  async createOrder(userId: string, dto: CreateOrderDto) {
    // 1. Chỉ trích xuất các trường định danh và cấu hình (bỏ qua hoàn toàn price, unitPrice, lineTotal do client gửi)
    const pricingInputs = dto.items.map((item) => ({
      productId: item.productId,
      size: item.size,
      qty: item.qty,
      toppingIds: item.toppingIds,
    }));

    // 2. Gọi PricingService tính lại đơn giá và tổng tiền từ Database.
    // Nếu topping không hợp lệ hoặc ngừng kinh doanh, PricingService sẽ ném BadRequestException
    const pricingResult = await this.pricingService.calculateOrderPricing(pricingInputs);

    // 3. Thực thi lưu trữ trong Prisma Transaction để đảm bảo tính nguyên tử (Atomicity).
    // Nếu có lỗi phát sinh trong quá trình tạo đơn, transaction sẽ tự động rollback và không tạo bất kỳ bản ghi nào.
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          total: pricingResult.total,
          items: {
            create: pricingResult.items.map((item) => ({
              productId: item.productId,
              size: item.size,
              qty: item.qty,
              lineTotal: item.lineTotal,
              topping:
                item.toppings.length > 0
                  ? item.toppings.map((t) => t.toppingName).join(', ')
                  : null,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return {
        orderId: order.id,
        id: order.id,
        status: order.status,
        total: order.total,
        items: order.items,
        pricing: pricingResult,
      };
    });
  }
}
