
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { orderEvents } from './order-events';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { OrderPricingResult, PricingService } from '../pricing/pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import { StockService } from '../stock/stock.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDetailDto, PaginatedOrdersDto, UpdatedOrderStatusDto } from './dto/order-detail.dto';
import { BaristaStatus } from './dto/update-order-status.dto';
import { CreatedOrderDto } from './dto/order-response.dto';
import { OrderStatusService } from './order-status.service';

/**
 * MÃ£ Ä‘Æ¡n hiá»ƒn thá»‹ cho khÃ¡ch, vÃ­ dá»¥ Ä‘Æ¡n id 1001 â†’ "#1001"
 */
export function formatOrderCode(orderId: number): string {
  return `#${orderId}`;
}

/** KhÃ³a chá»‘ng táº¡o trÃ¹ng Ä‘Æ¡n do client gá»­i qua header Idempotency-Key. */
export interface CreateOrderOptions {
  idempotencyKey?: string | null;
}

export interface CreateOrderResult extends CreatedOrderDto {
  /** true khi tráº£ láº¡i Ä‘Æ¡n Ä‘Ã£ táº¡o trÆ°á»›c Ä‘Ã³ báº±ng cÃ¹ng Idempotency-Key (HTTP 200) */
  replayed: boolean;
}

/** Báº£n ghi Order tá»‘i thiá»ƒu cáº§n Ä‘á»ƒ dá»±ng response; `items` cÃ³ thá»ƒ chÆ°a náº¡p khi vá»«a táº¡o. */
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
    private readonly orderStatusService: OrderStatusService,
  ) {}

  /**
   * Táº¡o Ä‘Æ¡n hÃ ng tráº¡ng thÃ¡i PENDING tá»« giá» hÃ ng cá»§a ngÆ°á»i dÃ¹ng.
   *
   * Sub-task 6.2/6.3 (Sprint 2): giÃ¡ do PricingService tÃ­nh tá»« DB, client price bá»‹ bá» qua.
   * Sub-task 10.4b (Sprint 3): Ã¡p mÃ£ giáº£m giÃ¡, lÆ°u subtotal/discount/promoCode, tÄƒng usedCount
   *                            cÃ³ Ä‘iá»u kiá»‡n trong CÃ™NG transaction.
   * Sub-task 10.2b (Sprint 3): Idempotency-Key â€” cÃ¹ng user + cÃ¹ng key chá»‰ táº¡o 1 Ä‘Æ¡n; náº¿u
   *                            request trÆ°á»›c Ä‘Ã£ táº¡o thÃ¬ tráº£ láº¡i Ä‘Æ¡n Ä‘Ã³ vá»›i `replayed = true`.
   */
  async create(
    userId: number,
    dto: CreateOrderDto,
    options: CreateOrderOptions = {},
  ): Promise<CreateOrderResult> {
    const idempotencyKey = normalizeIdempotencyKey(options.idempotencyKey);

    // 1. Fast path: náº¿u Ä‘Ã£ cÃ³ Ä‘Æ¡n vá»›i cÃ¹ng key thÃ¬ tráº£ láº¡i ngay, khÃ´ng tÃ­nh giÃ¡ láº¡i
    if (idempotencyKey) {
      const existing = await this.findExistingByKey(userId, idempotencyKey);
      if (existing) {
        return this.toResult(existing, true);
      }
    }

    // 2. TÃ­nh giÃ¡ tá»« DB (bá» qua má»i giÃ¡ client gá»­i)
    const pricing = await this.priceItems(
      dto.items.map((item) => ({
        productId: item.productId,
        size: item.size,
        qty: item.qty,
        toppingIds: item.toppingIds ?? [],
      })),
    );

    // 3. Ãp mÃ£ giáº£m giÃ¡ (náº¿u cÃ³) â€” kiá»ƒm tra quy táº¯c trÆ°á»›c khi má»Ÿ transaction
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

        // Giá»¯ tá»“n kho (optimistic locking) â€” 409 OUT_OF_STOCK náº¿u khÃ´ng Ä‘á»§ hÃ ng
        await this.stockService.reserve(
          tx,
          pricing.items.map((item) => ({ productId: item.productId, qty: item.qty })),
        );

        // TÄƒng lÆ°á»£t dÃ¹ng mÃ£ cÃ³ Ä‘iá»u kiá»‡n trong cÃ¹ng transaction
        if (promotion) {
          await this.promotionsService.consumeUsage(tx, promotion);
        }

        return created;
      });

      // PhÃ¡t sá»± kiá»‡n sau khi transaction Ä‘Ã£ commit thÃ nh cÃ´ng.
      // KhÃ´ng tá»± Ä‘á»™ng thá»±c hiá»‡n thanh toÃ¡n táº¡i Ä‘Ã¢y.
      orderEvents.emit('order.payment.pending', {
        orderId: order.id,
        userId,
        amount: total,
        currency: 'VND',
      });

      return this.toResult({ ...order, items: pricing.items }, false, pricing);
    } catch (error) {
      // Äua idempotency: request song song cÃ¹ng key, má»™t bÃªn Ä‘Ã£ commit trÆ°á»›c
      if (idempotencyKey && isUniqueViolation(error)) {
        const existing = await this.findExistingByKey(userId, idempotencyKey);
        if (existing) {
          return this.toResult(existing, true);
        }
        throw new ConflictException('ÄÆ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c táº¡o, vui lÃ²ng táº£i láº¡i trang');
      }

      throw this.mapPrismaError(error);
    }
  }

  /**
   * Láº¥y danh sÃ¡ch Ä‘Æ¡n hÃ ng cá»§a ngÆ°á»i dÃ¹ng (phÃ¢n trang, má»›i nháº¥t trÆ°á»›c) â€” Sub-task 9.1.
   */
  async findMyOrders(userId: number, page: number, limit: number): Promise<PaginatedOrdersDto> {
    const skip = (page - 1) * limit;

    const [orders, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      items: orders.map((o) => ({
        orderId: o.id,
        code: formatOrderCode(o.id),
        status: o.status,
        total: o.total,
        itemCount: o._count.items,
        createdAt: o.createdAt.toISOString(),
      })),
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
    };
  }

  /**
   * Láº¥y chi tiáº¿t Ä‘Æ¡n hÃ ng theo ID, kiá»ƒm tra quyá»n sá»Ÿ há»¯u â€” Sub-task 9.1.
   * Tráº£ 404 náº¿u Ä‘Æ¡n khÃ´ng tá»“n táº¡i hoáº·c khÃ´ng thuá»™c user.
   */
  async findById(userId: number, orderId: number): Promise<OrderDetailDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            toppings: {
              include: { topping: { select: { name: true } } },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng #${orderId}`);
    }

    const latestPayment = order.payments[0] ?? null;

    return {
      orderId: order.id,
      code: formatOrderCode(order.id),
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount,
      promoCode: order.promoCode,
      total: order.total,
      pointsEarned: order.pointsEarned,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        size: item.size,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        toppings: item.toppings.map((t) => ({
          id: t.toppingId,
          name: t.topping.name,
          price: t.price,
        })),
      })),
      payment: latestPayment
        ? {
            method: latestPayment.method,
            cardLast4: latestPayment.cardLast4 ?? null,
            paidAt: latestPayment.createdAt.toISOString(),
          }
        : null,
    };
  }

  /**
   * HÃ ng Ä‘á»£i quáº§y pha cháº¿ (BARISTA/ADMIN) â€” PB-32a.
   */
  async getQueue(): Promise<OrderDetailDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY] } },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            toppings: { include: { topping: { select: { name: true } } } },
          },
        },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    return orders.map((order) => {
      const latestPayment = order.payments[0] ?? null;
      return {
        orderId: order.id,
        code: formatOrderCode(order.id),
        status: order.status,
        subtotal: order.subtotal,
        discount: order.discount,
        promoCode: order.promoCode,
        total: order.total,
        pointsEarned: order.pointsEarned,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          size: item.size,
          qty: item.qty,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          toppings: item.toppings.map((t) => ({
            id: t.toppingId,
            name: t.topping.name,
            price: t.price,
          })),
        })),
        payment: latestPayment
          ? {
              method: latestPayment.method,
              cardLast4: latestPayment.cardLast4 ?? null,
              paidAt: latestPayment.createdAt.toISOString(),
            }
          : null,
      };
    });
  }

  /**
   * Chuyá»ƒn tráº¡ng thÃ¡i Ä‘Æ¡n hÃ ng (BARISTA/ADMIN) â€” Sub-task 10.1c.
   */
  async updateStatus(orderId: number, toStatus: BaristaStatus): Promise<UpdatedOrderStatusDto> {
    const updated = await this.prisma.$transaction(async (tx) => {
      return this.orderStatusService.transition(tx, orderId, toStatus as OrderStatus);
    });

    return {
      orderId: updated.id,
      code: formatOrderCode(updated.id),
      status: updated.status,
    };
  }

  /**
   * Há»§y Ä‘Æ¡n hÃ ng â€” NgÆ°á»i dÃ¹ng (chá»§ Ä‘Æ¡n) hoáº·c Barista/Admin.
   */
  async cancel(
    userId: number,
    role: string | undefined,
    orderId: number,
    reason?: string,
  ): Promise<UpdatedOrderStatusDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, promoCode: true, status: true },
    });

    if (!order) {
      throw new NotFoundException(`ÄÆ¡n hÃ ng #${orderId} khÃ´ng tá»“n táº¡i`);
    }

    const isOwner = order.userId === userId;
    const isStaff = role === Role.BARISTA || role === Role.ADMIN;
    if (!isOwner && !isStaff) {
      throw new ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n há»§y Ä‘Æ¡n hÃ ng nÃ y');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await this.orderStatusService.transition(
        tx,
        orderId,
        OrderStatus.CANCELLED,
        { reason },
      );

      if (order.promoCode) {
        await this.promotionsService.releaseUsage(tx, order.promoCode);
      }

      return updatedOrder;
    });

    return {
      orderId: updated.id,
      code: formatOrderCode(updated.id),
      status: updated.status,
    };
  }

  /** Tra cá»©u Ä‘Æ¡n Ä‘Ã£ táº¡o báº±ng (userId, idempotencyKey). */
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
   * Chuyá»ƒn báº£n ghi Order (kÃ¨m items) sang response contract v3.
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
   * Gá»i PricingService; sáº£n pháº©m khÃ´ng tá»“n táº¡i / ngá»«ng bÃ¡n tráº£ 400 theo contract v2.
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
   * Ãnh xáº¡ lá»—i Prisma sang HTTP.
   */
  private mapPrismaError(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return new ConflictException('ÄÆ¡n hÃ ng bá»‹ trÃ¹ng dá»¯ liá»‡u, vui lÃ²ng thá»­ láº¡i');
      }
      if (error.code === 'P2003') {
        return new BadRequestException(
          'Sáº£n pháº©m, topping hoáº·c tÃ i khoáº£n trong Ä‘Æ¡n hÃ ng khÃ´ng cÃ²n tá»“n táº¡i',
        );
      }
    }
    return error;
  }
}

/**
 * Chuáº©n hÃ³a header: rá»—ng/toÃ n khoáº£ng tráº¯ng coi nhÆ° khÃ´ng gá»­i; giá»›i háº¡n 128 kÃ½ tá»±.
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

