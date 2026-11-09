/**
 * Test (c) của Task 10 — Tồn kho đồng thời (Sub-task 10.3c)
 *
 * Chạy 20 POST /orders đồng thời (1 user, 20 idempotency-key khác nhau).
 * Mỗi đơn mua 1 ly sản phẩm có tồn kho 5.
 *
 * Kết quả bắt buộc:
 *   - Đúng 5 × 201 (đặt thành công)
 *   - Đúng 15 × 409 OUT_OF_STOCK
 *   - Tồn kho sau test = 0, không âm
 *
 * Yêu cầu: DATABASE_URL trỏ tới PostgreSQL thật (CI hoặc local dev).
 * Test bị skip tự động khi DATABASE_URL không được set.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../src/prisma/prisma.service';

const HAS_REAL_DB = !!process.env.DATABASE_URL;
const STOCK_LIMIT = 5;
const CONCURRENT_REQUESTS = 20;

(HAS_REAL_DB ? describe : describe.skip)(
  'StockService — Test (c): 20 request đồng thời, tồn kho 5',
  () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let token: string;
    let testProductId: number;
    const testEmail = `stock-concurrent-${Date.now()}@brewlite.test`;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleRef.createNestApplication();
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

      prisma = moduleRef.get<PrismaService>(PrismaService);

      // Tạo user test
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('TestPass123!', 10);
      const user = await prisma.user.create({
        data: { email: testEmail, passwordHash: hash },
      });
      token = moduleRef
        .get<JwtService>(JwtService)
        .sign({ sub: String(user.id), email: testEmail });

      // Lấy hoặc tạo danh mục test
      let category = await prisma.category.findFirst({ where: { name: 'Test' } });
      if (!category) {
        category = await prisma.category.create({ data: { name: 'Test' } });
      }

      // Tạo sản phẩm với tồn kho đúng = STOCK_LIMIT
      const product = await prisma.product.create({
        data: {
          name: `Test-Stock-Concurrent-${Date.now()}`,
          price: 10000,
          stock: STOCK_LIMIT,
          version: 0,
          categoryId: category.id,
        },
      });
      testProductId = product.id;

      await prisma.productSize.create({
        data: { productId: product.id, size: 'S', extraPrice: 0 },
      });
    }, 30000);

    afterAll(async () => {
      // Dọn dẹp theo thứ tự phụ thuộc khóa ngoại
      await prisma.orderItemTopping.deleteMany({
        where: { orderItem: { order: { user: { email: testEmail } } } },
      });
      await prisma.orderItem.deleteMany({
        where: { order: { user: { email: testEmail } } },
      });
      await prisma.order.deleteMany({ where: { user: { email: testEmail } } });
      await prisma.productSize.deleteMany({ where: { productId: testProductId } });
      await prisma.product.deleteMany({ where: { id: testProductId } });
      await prisma.user.deleteMany({ where: { email: testEmail } });
      await app.close();
    }, 15000);

    it(`${CONCURRENT_REQUESTS} request đồng thời: đúng ${STOCK_LIMIT} × 201, ${CONCURRENT_REQUESTS - STOCK_LIMIT} × 409 OUT_OF_STOCK, tồn kho = 0`, async () => {
      const orderBody = {
        items: [{ productId: testProductId, size: 'S', qty: 1, toppingIds: [] }],
      };

      // Mỗi request có Idempotency-Key riêng để tránh deduplication
      const responses = await Promise.all(
        Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
          request(app.getHttpServer())
            .post('/orders')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', `stock-c-${Date.now()}-${i}`)
            .send(orderBody),
        ),
      );

      const statuses = responses.map((r) => r.status);
      const successCount = statuses.filter((s) => s === 201).length;
      const outOfStockCount = statuses.filter((s) => s === 409).length;
      const unexpected = statuses.filter((s) => s !== 201 && s !== 409);

      expect(unexpected).toHaveLength(0);
      expect(successCount).toBe(STOCK_LIMIT);
      expect(outOfStockCount).toBe(CONCURRENT_REQUESTS - STOCK_LIMIT);

      // Mọi 409 phải có code OUT_OF_STOCK và productId đúng
      for (const resp of responses.filter((r) => r.status === 409)) {
        expect(resp.body.code).toBe('OUT_OF_STOCK');
        expect(resp.body.productId).toBe(testProductId);
      }

      // Tồn kho = 0 sau khi đúng 5 đơn được tạo
      const product = await prisma.product.findUnique({ where: { id: testProductId } });
      expect(product?.stock).toBe(0);
    }, 25000);
  },
);
