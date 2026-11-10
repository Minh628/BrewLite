
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrderStatus, Role } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { OrdersService } from '../../src/orders/orders.service';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Test Task 9.2: GET /orders/me, GET /orders/:id,
 * PATCH /orders/:id/status, GET /orders/queue,
 * POST /orders/:id/cancel.
 *
 * Dùng Prisma mock, không cần DB thật.
 */

const ORDER_PENDING = {
  id: 1001,
  userId: 7,
  status: OrderStatus.PENDING,
  subtotal: 178000,
  discount: 0,
  promoCode: null,
  total: 178000,
  pointsEarned: 0,
  idempotencyKey: null,
  createdAt: new Date('2026-11-02T08:00:00.000Z'),
  updatedAt: new Date('2026-11-02T08:00:00.000Z'),
};

const ORDER_PAID = {
  ...ORDER_PENDING,
  id: 1002,
  status: OrderStatus.PAID,
};

const ORDER_ITEMS = [
  {
    id: 1,
    orderId: 1001,
    productId: 3,
    size: 'L',
    qty: 2,
    unitPrice: 67000,
    lineTotal: 134000,
    product: { name: 'Cappuccino' },
    toppings: [
      { toppingId: 1, price: 5000, topping: { name: 'Trân châu' } },
      { toppingId: 2, price: 7000, topping: { name: 'Kem cheese' } },
    ],
  },
  {
    id: 2,
    orderId: 1001,
    productId: 5,
    size: 'M',
    qty: 1,
    unitPrice: 44000,
    lineTotal: 44000,
    product: { name: 'Trà đào' },
    toppings: [],
  },
];

describe('Orders history API (e2e) — Task 9.2', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let customerToken: string;
  let baristaToken: string;
  let otherUserToken: string;

  const prismaMock = {
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    orderItem: { create: jest.fn() },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
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

    jwtService = app.get<JwtService>(JwtService);
    customerToken = jwtService.sign({
      sub: 7,
      email: 'customer@test.com',
      role: Role.CUSTOMER,
    });
    baristaToken = jwtService.sign({
      sub: 99,
      email: 'barista@test.com',
      role: Role.BARISTA,
    });
    otherUserToken = jwtService.sign({
      sub: 8,
      email: 'other@test.com',
      role: Role.CUSTOMER,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── GET /orders/me ────────────────────────────────────────────────────────

  describe('GET /orders/me', () => {
    it('401 khi không có token', async () => {
      await request(app.getHttpServer()).get('/orders/me').expect(401);
    });

    it('200 với danh sách rỗng khi user chưa có đơn', async () => {
      prismaMock.order.findMany.mockResolvedValue([]);
      prismaMock.order.count.mockResolvedValue(0);

      const res = await request(app.getHttpServer())
        .get('/orders/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        items: [],
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 1,
      });
    });

    it('200 với danh sách đơn hàng và phân trang đúng', async () => {
      const dbOrders = [
        {
          id: 1001,
          status: OrderStatus.PENDING,
          total: 178000,
          createdAt: new Date('2026-11-02T08:00:00.000Z'),
          _count: { items: 2 },
        },
        {
          id: 1002,
          status: OrderStatus.PAID,
          total: 44000,
          createdAt: new Date('2026-11-01T10:00:00.000Z'),
          _count: { items: 1 },
        },
      ];
      prismaMock.order.findMany.mockResolvedValue(dbOrders);
      prismaMock.order.count.mockResolvedValue(2);

      const res = await request(app.getHttpServer())
        .get('/orders/me?page=1&limit=10')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        page: 1,
        limit: 10,
        totalItems: 2,
        totalPages: 1,
      });
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0]).toMatchObject({
        orderId: 1001,
        code: '#1001',
        status: OrderStatus.PENDING,
        total: 178000,
        itemCount: 2,
      });
    });

    it('phân trang: trả đúng page=2, limit=1', async () => {
      prismaMock.order.findMany.mockResolvedValue([
        {
          id: 1001,
          status: OrderStatus.PENDING,
          total: 178000,
          createdAt: new Date('2026-11-02T08:00:00.000Z'),
          _count: { items: 2 },
        },
      ]);
      prismaMock.order.count.mockResolvedValue(3);

      const res = await request(app.getHttpServer())
        .get('/orders/me?page=2&limit=1')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        page: 2,
        limit: 1,
        totalItems: 3,
        totalPages: 3,
      });

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 1, take: 1 }),
      );
    });
  });

  // ─── GET /orders/:id ───────────────────────────────────────────────────────

  describe('GET /orders/:id', () => {
    it('401 khi không có token', async () => {
      await request(app.getHttpServer()).get('/orders/1001').expect(401);
    });

    it('404 khi đơn không tồn tại hoặc không thuộc user', async () => {
      prismaMock.order.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/orders/1001')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);
    });

    it('200 với chi tiết đơn hàng đầy đủ', async () => {
      prismaMock.order.findFirst.mockResolvedValue({
        ...ORDER_PENDING,
        items: ORDER_ITEMS,
        payments: [],
      });

      const res = await request(app.getHttpServer())
        .get('/orders/1001')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        orderId: 1001,
        code: '#1001',
        status: OrderStatus.PENDING,
        subtotal: 178000,
        discount: 0,
        total: 178000,
      });
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0]).toMatchObject({
        productId: 3,
        productName: 'Cappuccino',
        size: 'L',
        qty: 2,
        unitPrice: 67000,
        lineTotal: 134000,
        toppings: expect.arrayContaining([
          expect.objectContaining({ name: 'Trân châu', price: 5000 }),
        ]),
      });
      expect(res.body.payment).toBeNull();
    });

    it('kiểm tra ownership: findFirst được gọi với userId từ JWT', async () => {
      prismaMock.order.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/orders/1001')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);

      expect(prismaMock.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 1001, userId: 7 }),
        }),
      );
    });
  });

  // ─── PATCH /orders/:id/status ──────────────────────────────────────────────

  describe('PATCH /orders/:id/status', () => {
    it('401 khi không có token', async () => {
      await request(app.getHttpServer())
        .patch('/orders/1001/status')
        .send({ status: 'PREPARING' })
        .expect(401);
    });

    it('403 khi CUSTOMER cố cập nhật trạng thái', async () => {
      const res = await request(app.getHttpServer())
        .patch('/orders/1001/status')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'PREPARING' })
        .expect(403);

      expect(res.body.code).toBe('FORBIDDEN_ROLE');
    });

    it('400 khi status không hợp lệ (PENDING không có trong BaristaStatus)', async () => {
      await request(app.getHttpServer())
        .patch('/orders/1001/status')
        .set('Authorization', `Bearer ${baristaToken}`)
        .send({ status: 'PENDING' })
        .expect(400);
    });

    it('200 khi BARISTA chuyển PAID → PREPARING', async () => {
      prismaMock.$transaction.mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            $queryRaw: jest.fn().mockResolvedValue([
              {
                id: 1002,
                status: OrderStatus.PAID,
                userId: 7,
                total: 178000,
              },
            ]),
            order: {
              update: jest.fn().mockResolvedValue({
                ...ORDER_PAID,
                status: OrderStatus.PREPARING,
              }),
            },
          };
          return cb(tx);
        },
      );

      const res = await request(app.getHttpServer())
        .patch('/orders/1002/status')
        .set('Authorization', `Bearer ${baristaToken}`)
        .send({ status: 'PREPARING' })
        .expect(200);

      expect(res.body).toMatchObject({
        orderId: 1002,
        code: '#1002',
        status: OrderStatus.PREPARING,
      });
    });

    it('409 INVALID_TRANSITION khi chuyển trạng thái không hợp lệ (PENDING → READY)', async () => {
      prismaMock.$transaction.mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            $queryRaw: jest.fn().mockResolvedValue([
              {
                id: 1001,
                status: OrderStatus.PENDING,
                userId: 7,
                total: 178000,
              },
            ]),
            order: { update: jest.fn() },
          };
          return cb(tx);
        },
      );

      const res = await request(app.getHttpServer())
        .patch('/orders/1001/status')
        .set('Authorization', `Bearer ${baristaToken}`)
        .send({ status: 'READY' })
        .expect(409);

      expect(res.body.error).toBe('INVALID_TRANSITION');
    });
  });

  // ─── GET /orders/queue ─────────────────────────────────────────────────────

  describe('GET /orders/queue', () => {
    it('401 khi không có token', async () => {
      await request(app.getHttpServer())
        .get('/orders/queue')
        .expect(401);
    });

    it('403 khi CUSTOMER truy cập hàng đợi pha chế', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders/queue')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(res.body.code).toBe('FORBIDDEN_ROLE');
    });

    it('200 khi BARISTA truy cập hàng đợi pha chế', async () => {
      const ordersService = app.get(OrdersService);
      const spy = jest.spyOn(ordersService, 'getQueue').mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/orders/queue')
        .set('Authorization', `Bearer ${baristaToken}`)
        .expect(200);

      expect(res.body).toEqual([]);
      expect(spy).toHaveBeenCalled();
    });
  });

  // ─── POST /orders/:id/cancel ───────────────────────────────────────────────

  describe('POST /orders/:id/cancel', () => {
    it('401 khi không có token', async () => {
      await request(app.getHttpServer())
        .post('/orders/1001/cancel')
        .send({ reason: 'Customer request' })
        .expect(401);
    });

    it('201 khi chủ đơn hủy đơn thành công', async () => {
      const ordersService = app.get(OrdersService);
      const spy = jest.spyOn(ordersService, 'cancel').mockResolvedValue({
        orderId: 1001,
        code: '#1001',
        status: OrderStatus.CANCELLED,
      });

      const res = await request(app.getHttpServer())
        .post('/orders/1001/cancel')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Customer request' })
        .expect(201);

      expect(res.body).toMatchObject({
        orderId: 1001,
        code: '#1001',
        status: OrderStatus.CANCELLED,
      });

      expect(spy).toHaveBeenCalledWith(
        7,
        Role.CUSTOMER,
        1001,
        'Customer request',
      );
    });
  });
});
