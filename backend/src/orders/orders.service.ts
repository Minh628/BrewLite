import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { OrderPricingResult, PricingService } from '../pricing/pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import { StockService } from '../stock/stock.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatedOrderDto } from './dto/order-response.dto';

/**
 * Mã đơn hiển thị cho khách, ví dụ đơn id 1001 → "#1001"
 */
export function formatOrderCode(orderId: number): string {
  return `#${orderId}`;
}

/** Khóa chống tạo trùng đơn do client gửi qua header Idempotency-Key. */
export interface CreateOrderOptions {
  idempotencyKey?: string | null;
}

export interface CreateOrderResult extends CreatedOrderDto {
  /** true khi trả lại đơn đã tạo trước đó bằng cùng Idempotency-Key (HTTP 200) */
  replayed: boolean;
}

/** Bản ghi Order tối thiểu cần để dựng response; `items` có thể chưa nạp khi vừa tạo. */
type OrderRecord = Prisma.OrderGetPayload<object> & {
  items: Array<
    Pick<
      Prisma.OrderItemGetPayload<object>,
      'productId' | 'size' | 'qty' | 'unitPrice' | 'lineTotal'
    >
  >;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly promotionsService: PromotionsService,
    private readonly stockService: StockService,
  ) {}

  /**
   * Tạo đơn hàng trạng thái PENDING từ giỏ hàng của người dùng.
   *
   * Sub-task 6.2/6.3 (Sprint 2): giá do PricingService tính từ DB, client price bị bỏ qua.
   * Sub-task 10.4b (Sprint 3): áp mã giảm giá, lưu subtotal/discount/promoCode, tăng usedCount
   *                            có điều kiện trong CÙNG transaction.
   * Sub-task 10.2b (Sprint 3): Idempotency-Key — cùng user + cùng key chỉ tạo 1 đơn; nếu
   *                            request trước đã tạo thì trả lại đơn đó với `replayed = true`.
   */
  async create(
    userId: number,
    dto: CreateOrderDto,
    options: CreateOrderOptions = {},
  ): Promise<CreateOrderResult> {
    const idempotencyKey = normalizeIdempotencyKey(options.idempotencyKey);

    // 1. Fast path: nếu đã có đơn với cùng key thì trả lại ngay, không tính giá lại
    if (idempotencyKey) {
      const existing = await this.findExistingByKey(userId, idempotencyKey);
      if (existing) {
        return this.toResult(existing, true);
      }
    }

    // 2. Tính giá từ DB (bỏ qua mọi giá client gửi)
    const pricing = await this.priceItems(
      dto.items.map((item) => ({
        productId: item.productId,
        size: item.size,
        qty: item.qty,
        toppingIds: item.toppingIds ?? [],
      })),
    );

    // 3. Áp mã giảm giá (nếu có) — kiểm tra quy tắc trước khi mở transaction
    const promotion = dto.promoCode
      ? await this.promotionsService.findPromotion(dto.promoCode)
      : null;
    const validated = promotion
      ? this.promotionsService.evaluate(promotion, pricing.subtotal)
      : null;

    const discount = validated?.discount ?? 0;
    const total = Math.max(0, pricing.subtotal - discount);

    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            userId,
            status: OrderStatus.PENDING,
            subtotal: pricing.subtotal,
            discount,
            promoCode: validated?.code ?? null,
            total,
            idempotencyKey: idempotencyKey ?? null,
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

        // Giữ tồn kho (optimistic locking) — 409 OUT_OF_STOCK nếu không đủ hàng (10.3b)
        await this.stockService.reserve(
          tx,
          pricing.items.map((item) => ({ productId: item.productId, qty: item.qty })),
        );

        // Tăng lượt dùng mã có điều kiện trong cùng transaction: hết lượt → rollback cả đơn
        if (promotion) {
          await this.promotionsService.consumeUsage(tx, promotion);
        }

        return created;
      });

      return this.toResult({ ...order, items: pricing.items }, false, pricing);
    } catch (error) {
      // Đua idempotency: request song song cùng key, một bên đã commit trước → trả lại đơn đó
      if (idempotencyKey && isUniqueViolation(error)) {
        const existing = await this.findExistingByKey(userId, idempotencyKey);
        if (existing) {
          return this.toResult(existing, true);
        }
        throw new ConflictException('Đơn hàng đã được tạo, vui lòng tải lại trang');
      }

      throw this.mapPrismaError(error);
    }
  }

  /** Tra cứu đơn đã tạo bằng (userId, idempotencyKey). */
  private async findExistingByKey(
    userId: number,
    idempotencyKey: string,
  ): Promise<Prisma.OrderGetPayload<{ include: { items: true } }> | null> {
    return this.prisma.order.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: { items: true },
    });
  }

  /**
   * Chuyển bản ghi Order (kèm items) sang response contract v3.
   * Với đơn đã tạo trước đó, tính lại subtotal từ các dòng nếu DB chưa có.
   */
  private toResult(
    order: OrderRecord,
    replayed: boolean,
    pricing?: OrderPricingResult,
  ): CreateOrderResult {
    const items = order.items.map((item) => ({
      productId: item.productId,
      size: item.size,
      qty: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }));

    const subtotal =
      pricing?.subtotal ?? order.subtotal ?? items.reduce((sum, item) => sum + item.lineTotal, 0);

    return {
      orderId: order.id,
      code: formatOrderCode(order.id),
      status: order.status,
      subtotal,
      discount: order.discount ?? 0,
      promoCode: order.promoCode ?? null,
      total: order.total ?? Math.max(0, subtotal - (order.discount ?? 0)),
      items,
      createdAt: order.createdAt.toISOString(),
      replayed,
    };
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

/**
 * Chuẩn hóa header: rỗng/toàn khoảng trắng coi như không gửi; giới hạn 128 ký tự để
 * không lưu giá trị bất thường vào cột unique.
 */
function normalizeIdempotencyKey(key: string | null | undefined): string | undefined {
  if (typeof key !== 'string') return undefined;
  const trimmed = key.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, 128);
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
