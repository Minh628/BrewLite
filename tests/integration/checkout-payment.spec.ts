// tests/integration/checkout-payment.spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../../backend/src/app.module';
import { HttpExceptionFilter } from '../../backend/src/common/filters/http-exception.filter';
import { PrismaService } from '../../backend/src/prisma/prisma.service';

describe('T5.2-b: Checkout & Payment Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let testProductId: number;
  let testUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    const jwt = app.get(JwtService);

    // 1. Tạo hoặc lấy tài khoản khách hàng test
    let customer = await prisma.user.findFirst({
      where: { email: 'customer@brewlite.vn' },
    });
    if (!customer) {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('password123', 10);
      customer = await prisma.user.create({
        data: {
          email: 'customer@brewlite.vn',
          passwordHash: hash,
          loyaltyPoints: 0,
        },
      });
    }
    testUserId = customer.id;
    customerToken = jwt.sign({ sub: testUserId, email: customer.email });

    // 2. Lấy hoặc tạo sản phẩm có đủ tồn kho để test
    let product = await prisma.product.findFirst({
      where: { isActive: true },
      include: { sizes: true },
    });
    if (!product) {
      let category = await prisma.category.findFirst();
      if (!category) {
        category = await prisma.category.create({ data: { name: 'Cà phê' } });
      }
      product = await prisma.product.create({
        data: {
          name: 'Cà phê Test Integration',
          price: 35000,
          stock: 100,
          version: 0,
          categoryId: category.id,
          sizes: {
            create: [
              { size: 'S', extraPrice: 0 },
              { size: 'M', extraPrice: 5000 },
              { size: 'L', extraPrice: 10000 },
            ],
          },
        },
        include: { sizes: true },
      });
    } else {
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: { increment: 50 } },
      });
    }
    testProductId = product.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Happy Path: Tạo đơn hàng và thanh toán thành công -> Đơn chuyển sang PAID và cộng điểm tích lũy', async () => {
    const idempotencyKey = `int_success_${Date.now()}`;

    // Bước 1: POST /orders
    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        items: [{ productId: testProductId, size: 'M', qty: 2 }],
      })
      .expect(201);

    const orderId = orderRes.body.orderId ?? orderRes.body.id;
    expect(orderId).toBeDefined();
    expect(orderRes.body.status).toBe(OrderStatus.PENDING);
    expect(orderRes.body.total).toBeGreaterThan(0);

    // Bước 2: POST /payments (dùng thẻ hợp lệ 4242 4242 4242 4242)
    const payRes = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', `pay_${idempotencyKey}`)
      .send({
        orderId,
        method: 'CARD',
        cardNumber: '4242 4242 4242 4242',
      })
      .expect(201);

    expect(payRes.body.status).toBe(OrderStatus.PAID);

    // Bước 3: Xác thực đơn hàng trong Database đã chuyển sang PAID và được gán pointsEarned
    const orderInDb = await prisma.order.findUnique({ where: { id: orderId } });
    expect(orderInDb?.status).toBe(OrderStatus.PAID);
    expect(orderInDb?.pointsEarned).toBeGreaterThanOrEqual(1);

    // Xác thực bản ghi thanh toán trong Database là SUCCEEDED
    const paymentInDb = await prisma.payment.findFirst({ where: { orderId } });
    expect(paymentInDb?.status).toBe(PaymentStatus.SUCCEEDED);
  });

  it('2. Fail Path: Thanh toán với thẻ bị từ chối -> Đơn chuyển sang PAYMENT_FAILED, không hủy đơn', async () => {
    const idempotencyKey = `int_failed_${Date.now()}`;

    // Bước 1: Tạo đơn PENDING
    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        items: [{ productId: testProductId, size: 'S', qty: 1 }],
      })
      .expect(201);

    const orderId = orderRes.body.orderId ?? orderRes.body.id;
    expect(orderId).toBeDefined();

    // Bước 2: Thanh toán thẻ lỗi (4000...0002 mô phỏng thẻ bị từ chối)
    const payRes = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', `pay_${idempotencyKey}`)
      .send({
        orderId,
        method: 'CARD',
        cardNumber: '4000 0000 0000 0002',
      })
      .expect(201);

    expect(payRes.body.status).toBe(OrderStatus.PAYMENT_FAILED);

    // Bước 3: Xác thực đơn hàng trong Database ở trạng thái PAYMENT_FAILED (khách có thể thử lại)
    const orderInDb = await prisma.order.findUnique({ where: { id: orderId } });
    expect(orderInDb?.status).toBe(OrderStatus.PAYMENT_FAILED);

    // Xác thực bản ghi thanh toán trong Database là FAILED
    const paymentInDb = await prisma.payment.findFirst({
      where: { orderId, idempotencyKey: `pay_${idempotencyKey}` },
    });
    expect(paymentInDb?.status).toBe(PaymentStatus.FAILED);
  });

  it('3. Idempotency Check: Gửi 2 lần cùng một Idempotency-Key chỉ tạo duy nhất 1 đơn hàng', async () => {
    const idempotencyKey = `int_idemp_${Date.now()}`;

    // Lần gọi 1
    const res1 = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        items: [{ productId: testProductId, size: 'L', qty: 1 }],
      })
      .expect(201);

    const id1 = res1.body.orderId ?? res1.body.id;

    // Lần gọi 2 với cùng key và body
    const res2 = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        items: [{ productId: testProductId, size: 'L', qty: 1 }],
      });

    const id2 = res2.body.orderId ?? res2.body.id;

    // Cùng order ID, không tạo thêm bản ghi mới trong database
    expect(id2).toBe(id1);
  });
});
