import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { MockPaymentGateway } from '../../src/payments/mock-payment.gateway';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Payments API (e2e)', () => {
  let app: INestApplication;
  let customerToken: string;
  let otherCustomerToken: string;
  let orderStatus: OrderStatus;
  const payments = new Map<string, Record<string, unknown>>();

  const tx = {
    $queryRaw: jest.fn(async (_query: TemplateStringsArray, ...values: number[]) =>
      values.length > 1 && values[1] !== 7
        ? []
        : [{ id: 21, userId: 7, status: orderStatus, total: 70000 }],
    ),
    payment: {
      findUnique: jest.fn(async ({ where }: { where: { idempotencyKey: string } }) => {
        return payments.get(where.idempotencyKey) ?? null;
      }),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        payments.set(data.idempotencyKey as string, data);
        return data;
      }),
    },
    order: {
      update: jest.fn(async ({ data }: { data: { status: OrderStatus } }) => {
        orderStatus = data.status;
        return { id: 21, userId: 7, total: 70000, pointsEarned: 0, ...data };
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: { update: jest.fn().mockResolvedValue({}) },
  };

  const prismaMock = {
    $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) => callback(tx)),
    payment: tx.payment,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(MockPaymentGateway)
      .useValue({
        charge: jest.fn(async ({ cardNumber }: { cardNumber?: string }) => ({
          succeeded: cardNumber !== '4000 0000 0000 0002',
          failureReason: cardNumber === '4000 0000 0000 0002' ? 'Thẻ bị từ chối' : undefined,
        })),
      })
      .compile();

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

    const jwt = app.get(JwtService);
    customerToken = jwt.sign({ sub: 7, email: 'customer@test.com' });
    otherCustomerToken = jwt.sign({ sub: 8, email: 'other@test.com' });
  });

  beforeEach(() => {
    orderStatus = OrderStatus.PENDING;
    payments.clear();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const pay = (token = customerToken, key = 'payment-key', card = '4242 4242 4242 4242') =>
    request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', key)
      .send({ orderId: 21, method: PaymentMethod.CARD, cardNumber: card });

  it('requires authentication and an idempotency key', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .send({ orderId: 21, method: PaymentMethod.CARD, cardNumber: '4242424242424242' })
      .expect(401);
    await pay(customerToken, '').expect(400);
  });

  it('marks a successful payment as PAID and replays its idempotent response', async () => {
    const first = await pay().expect(201);
    expect(first.body).toMatchObject({
      orderId: 21,
      amount: 70000,
      status: OrderStatus.PAID,
      cardLast4: '4242',
    });
    expect(first.body).not.toHaveProperty('cardNumber');
    expect(orderStatus).toBe(OrderStatus.PAID);

    const replay = await pay().expect(200);
    expect(replay.headers['idempotent-replayed']).toBe('true');
    expect(replay.body).toEqual(first.body);
    await pay(customerToken, 'different-key').expect(409);
    await pay(customerToken, 'payment-key', '4000 0000 0000 0002').expect(422);
  });

  it('allows a failed payment to be retried with a new key', async () => {
    const failed = await pay(customerToken, 'failed-key', '4000 0000 0000 0002').expect(201);
    expect(failed.body.status).toBe(OrderStatus.PAYMENT_FAILED);
    expect(orderStatus).toBe(OrderStatus.PAYMENT_FAILED);

    const retried = await pay(customerToken, 'retry-key').expect(201);
    expect(retried.body.status).toBe(OrderStatus.PAID);
    expect(orderStatus).toBe(OrderStatus.PAID);
  });

  it('does not disclose another user’s order', async () => {
    await pay(otherCustomerToken).expect(404);
  });
});
