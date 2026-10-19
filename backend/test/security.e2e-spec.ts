import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import helmet from 'helmet';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Test suite kiểm thử toàn diện các tính năng bảo mật (Security & Anti-tampering):
 * 1. Rate-limit 5 req/phút cho /auth/login chống tấn công brute-force (AT-22)
 * 2. Cấu hình Helmet bổ sung HTTP security headers
 * 3. Ẩn stack trace và chi tiết schema DB khi gặp lỗi 500 ở môi trường Production
 * 4. Truy vết lỗi hệ thống thông qua header và body X-Request-Id
 */
describe('API Security (e2e)', () => {
  let app: INestApplication;

  const prismaMock = {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();

    // Kích hoạt Helmet và ValidationPipe tương tự main.ts
    app.use(helmet());
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Rate-limiting Throttler (AT-22)', () => {
    it('cho phép tối đa 5 requests và trả về HTTP 429 Too Many Requests ở request thứ 6 vào /auth/login', async () => {
      // 5 requests đầu tiên: thông tin sai -> nhận mã lỗi 401 Unauthorized chứ không bị 429
      for (let i = 1; i <= 5; i++) {
        const response = await request(app.getHttpServer()).post('/auth/login').send({
          email: 'brute-force@brewlite.vn',
          password: 'wrongpassword',
        });
        expect(response.status).toBe(401);
      }

      // Request thứ 6 trong vòng 60 giây: Throttler chặn lại và trả về HTTP status 429
      const response6 = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'brute-force@brewlite.vn',
        password: 'wrongpassword',
      });

      expect(response6.status).toBe(429);
      expect(response6.body).toEqual(
        expect.objectContaining({
          statusCode: 429,
          error: 'Too Many Requests',
        }),
      );
    });
  });

  describe('Helmet HTTP Security Headers', () => {
    it('tự động thiết lập các headers bảo mật X-Content-Type-Options và X-Frame-Options', async () => {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.status).toBe(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  describe('Production 500 Error & Stack Trace Protection', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('luôn đính kèm header X-Request-Id cho mọi response lỗi', async () => {
      const response = await request(app.getHttpServer()).get('/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('sử dụng lại X-Request-Id từ client gửi lên nếu có', async () => {
      const customRequestId = 'test-client-request-id-12345';
      const response = await request(app.getHttpServer())
        .get('/non-existent-route')
        .set('X-Request-Id', customRequestId);

      expect(response.headers['x-request-id']).toBe(customRequestId);
    });

    it('ẩn toàn bộ stack trace và chi tiết schema khi gặp lỗi 500 ở môi trường production', async () => {
      process.env.NODE_ENV = 'production';

      // Giả lập lỗi runtime nội bộ tại database
      prismaMock.user.findUnique.mockRejectedValueOnce(
        new Error('Fatal DB Connection Error: Table schema secrets exposed in SELECT * FROM users'),
      );

      const response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'db-crash@brewlite.vn',
        password: 'securepassword123',
      });

      expect(response.status).toBe(500);
      // Kiểm chứng response chỉ gồm 4 trường chuẩn hóa, không có error stack hay path
      expect(response.body).toEqual({
        statusCode: 500,
        message: 'Internal server error',
        requestId: expect.any(String),
        timestamp: expect.any(String),
      });
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('error');
    });
  });
});
