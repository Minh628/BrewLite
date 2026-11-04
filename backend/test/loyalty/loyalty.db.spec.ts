import { NestFactory } from '@nestjs/core';
import { OrderStatus } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { LoyaltyService } from '../../src/loyalty/loyalty.service';
import { OrderStatusService } from '../../src/orders/order-status.service';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Kiểm chứng tích hợp Loyalty ↔ State Machine trên PostgreSQL THẬT.
 *
 * Chạy: `npx jest --runInBand test/loyalty/loyalty.db.spec.ts`
 * Tự bỏ qua khi không kết nối được DB (ví dụ CI không có Postgres).
 * Dữ liệu test được tạo và dọn riêng, không ảnh hưởng đơn của người khác.
 */
describe('Loyalty ↔ State Machine trên DB thật (Sub-task 10.4c)', () => {
  let app: Awaited<ReturnType<typeof NestFactory.createApplicationContext>>;
  let prisma: PrismaService;
  let orderStatus: OrderStatusService;
  let loyalty: LoyaltyService;
  let available = false;
  let userId: number;
  let orderId: number;

  beforeAll(async () => {
    app = await NestFactory.createApplicationContext(AppModule, { logger: false });
    prisma = app.get(PrismaService);
    orderStatus = app.get(OrderStatusService);
    loyalty = app.get(LoyaltyService);

    try {
      await prisma.$queryRawUnsafe('SELECT 1');
      available = true;
    } catch {
      available = false;
    }
  });

  beforeEach(async () => {
    if (!available) return;

    const user = await prisma.user.create({
      data: {
        email: `loyalty-test-${Date.now()}@brewlite.vn`,
        passwordHash: 'x',
        loyaltyPoints: 0,
      },
    });
    userId = user.id;

    const order = await prisma.order.create({
      data: { userId, status: OrderStatus.PENDING, subtotal: 162000, total: 162000 },
    });
    orderId = order.id;
  });

  afterEach(async () => {
    if (!available || !userId) return;
    await prisma.payment.deleteMany({ where: { orderId } });
    await prisma.orderItemTopping.deleteMany({ where: { orderItem: { orderId } } });
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.deleteMany({ where: { id: orderId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('PAID → cộng đúng floor(total/10.000) điểm', async () => {
    if (!available) return;

    await prisma.$transaction((tx) => orderStatus.transition(tx, orderId, OrderStatus.PAID));

    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    expect(order.status).toBe(OrderStatus.PAID);
    expect(order.pointsEarned).toBe(16);
    expect(user.loyaltyPoints).toBe(16);
  });

  it('award gọi lặp (retry) không cộng điểm lần hai', async () => {
    if (!available) return;

    await prisma.$transaction((tx) => orderStatus.transition(tx, orderId, OrderStatus.PAID));
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

    const extra = await prisma.$transaction((tx) =>
      loyalty.award(tx, {
        id: order.id,
        userId: order.userId,
        total: order.total,
        pointsEarned: order.pointsEarned,
      }),
    );

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(extra).toBe(0);
    expect(user.loyaltyPoints).toBe(16);
  });

  it('PAID → CANCELLED thu hồi điểm, không trừ hai lần', async () => {
    if (!available) return;

    await prisma.$transaction((tx) => orderStatus.transition(tx, orderId, OrderStatus.PAID));
    await prisma.$transaction((tx) =>
      orderStatus.transition(tx, orderId, OrderStatus.CANCELLED, { reason: 'Test hủy' }),
    );

    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    expect(order.status).toBe(OrderStatus.CANCELLED);
    expect(order.pointsEarned).toBe(0);
    expect(user.loyaltyPoints).toBe(0);
  });

  it('PAYMENT_FAILED → PAID vẫn cộng đúng 1 lần', async () => {
    if (!available) return;

    await prisma.$transaction((tx) =>
      orderStatus.transition(tx, orderId, OrderStatus.PAYMENT_FAILED),
    );
    await prisma.$transaction((tx) => orderStatus.transition(tx, orderId, OrderStatus.PAID));

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.loyaltyPoints).toBe(16);
  });
});
