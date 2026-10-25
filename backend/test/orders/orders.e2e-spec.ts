import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../src/prisma/prisma.service';
import { EXPECTED_TOTAL, findProductsByIds, validOrderBody } from './order-fixtures';

describe('Orders API (e2e) - POST /orders (Sub-task 6.6)', () => {
  let app: INestApplication;
  let token: string;

  const txMock = {
    order: { create: jest.fn() },
    orderItem: { create: jest.fn() },
  };

  const prismaMock = {
    product: { findMany: jest.fn() },
    $transaction: jest.fn((callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock)),
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

    token = app.get(JwtService).sign({ sub: '7', email: 'customer@brewlite.vn' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.product.findMany.mockImplementation(findProductsByIds);
    txMock.order.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 1001, createdAt: new Date('2026-10-24T10:00:00Z'), ...data }),
    );
    txMock.orderItem.create.mockResolvedValue({});
  });

  afterAll(async () => {
    await app.close();
  });

  const postOrder = (body: unknown, authToken: string | null = token) => {
    const req = request(app.getHttpServer()).post('/orders');
    if (authToken) {
      req.set('Authorization', `Bearer ${authToken}`);
    }
    return req.send(body as object);
  };

  describe('401 Unauthorized', () => {
    it('trả 401 khi thiếu Bearer token', async () => {
      const response = await postOrder(validOrderBody, null);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ statusCode: 401, path: '/orders' });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('trả 401 khi token sai chữ ký', async () => {
      const response = await postOrder(validOrderBody, `${token}sai`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Token không hợp lệ');
    });

    it('trả 401 khi token hết hạn', async () => {
      const expired = app
        .get(JwtService)
        .sign({ sub: '7', email: 'customer@brewlite.vn' }, { expiresIn: -10 });

      const response = await postOrder(validOrderBody, expired);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Token đã hết hạn');
    });
  });

  describe('400 Bad Request khi sai DTO', () => {
    it.each([
      ['thiếu items', {}, 'items phải có ít nhất 1 món'],
      ['items rỗng', { items: [] }, 'items phải có ít nhất 1 món'],
      ['items không phải mảng', { items: 'abc' }, 'items phải là một mảng'],
      ['qty = 0', { items: [{ productId: 3, size: 'M', qty: 0 }] }, 'qty tối thiểu là 1'],
      ['qty = 21', { items: [{ productId: 3, size: 'M', qty: 21 }] }, 'qty tối đa là 20'],
      ['qty lẻ', { items: [{ productId: 3, size: 'M', qty: 1.5 }] }, 'qty phải là số nguyên'],
      [
        'size XL',
        { items: [{ productId: 3, size: 'XL', qty: 1 }] },
        'size phải là một trong các giá trị: S, M, L',
      ],
      [
        'productId không phải số',
        { items: [{ productId: 'abc', size: 'M', qty: 1 }] },
        'productId phải là số nguyên',
      ],
      [
        'toppingIds chứa chuỗi',
        { items: [{ productId: 3, size: 'M', qty: 1, toppingIds: ['a'] }] },
        'Mỗi phần tử của toppingIds phải là số nguyên',
      ],
      [
        'toppingIds trùng',
        { items: [{ productId: 3, size: 'M', qty: 1, toppingIds: [1, 1] }] },
        'toppingIds không được chứa giá trị trùng lặp',
      ],
    ])('%s', async (_case, body, expectedMessage) => {
      const response = await postOrder(body);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
        path: '/orders',
      });
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining(expectedMessage)]),
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('từ chối field lạ không thuộc contract', async () => {
      const response = await postOrder({
        items: [{ productId: 3, size: 'M', qty: 1, discount: 100 }],
      });

      expect(response.status).toBe(400);
    });

    it('trả 400 khi sản phẩm không tồn tại', async () => {
      const response = await postOrder({ items: [{ productId: 404, size: 'M', qty: 1 }] });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Sản phẩm với mã '404'");
    });

    it('trả 400 khi topping không hợp lệ cho sản phẩm', async () => {
      const response = await postOrder({
        items: [{ productId: 5, size: 'M', qty: 1, toppingIds: [1] }],
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Topping '1'");
    });
  });

  describe('201 Created', () => {
    it('tạo đơn PENDING đúng contract v2 cho user trong token', async () => {
      const response = await postOrder(validOrderBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        orderId: 1001,
        code: '#1001',
        status: 'PENDING',
        total: EXPECTED_TOTAL,
        items: [
          { productId: 3, size: 'L', qty: 2, unitPrice: 67000, lineTotal: 134000 },
          { productId: 5, size: 'M', qty: 1, unitPrice: 44000, lineTotal: 44000 },
        ],
        createdAt: '2026-10-24T10:00:00.000Z',
      });
      expect(txMock.order.create).toHaveBeenCalledWith({
        data: { userId: 7, status: 'PENDING', total: EXPECTED_TOTAL },
      });
      expect(txMock.orderItem.create).toHaveBeenCalledTimes(2);
    });

    it('bỏ qua giá giả do client gửi, vẫn tính đúng tổng', async () => {
      const response = await postOrder({
        total: 1000,
        items: validOrderBody.items.map((item) => ({
          ...item,
          price: 1,
          unitPrice: 1,
          lineTotal: 1,
        })),
      });

      expect(response.status).toBe(201);
      expect(response.body.total).toBe(EXPECTED_TOTAL);
      expect(response.body.items.map((i: { unitPrice: number }) => i.unitPrice)).toEqual([
        67000, 44000,
      ]);
      expect(txMock.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ total: EXPECTED_TOTAL }),
      });
    });
  });
});
