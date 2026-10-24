import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../src/prisma/prisma.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('Request logging & X-Request-Id (PB-23 / Sub-task 23.2)', () => {
  let app: INestApplication;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const prismaMock = {
    product: { findMany: jest.fn() },
    category: { findMany: jest.fn() },
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
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.product.findMany.mockResolvedValue([]);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  /** Dòng log truy cập: `[requestId] METHOD url status 12.3ms` */
  const accessLine = (spy: jest.SpyInstance, requestId: string, rest: string) =>
    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(`^\\[${requestId}\\] ${rest.replace(/[?]/g, '\\?')} \\d+\\.\\dms$`),
      ),
    );

  it('request thành công: log mức info có method, url, status, thời gian và requestId của header', async () => {
    const response = await request(app.getHttpServer()).get('/products?q=ca').expect(200);
    const requestId = response.headers['x-request-id'];

    expect(requestId).toMatch(UUID);
    accessLine(logSpy, requestId, 'GET /products?q=ca 200');
  });

  it('dùng lại X-Request-Id hợp lệ do client gửi lên', async () => {
    const response = await request(app.getHttpServer())
      .get('/categories')
      .set('X-Request-Id', 'fe-trace-123')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('fe-trace-123');
    accessLine(logSpy, 'fe-trace-123', 'GET /categories 200');
  });

  it('bỏ X-Request-Id không an toàn và sinh UUID mới (chống giả mạo log)', async () => {
    const response = await request(app.getHttpServer())
      .get('/categories')
      .set('X-Request-Id', 'abc 200 GET /fake')
      .expect(200);

    expect(response.headers['x-request-id']).toMatch(UUID);
  });

  it('request bị guard chặn (401): log mức warn, requestId trùng header và body lỗi', async () => {
    const response = await request(app.getHttpServer()).post('/orders').send({}).expect(401);
    const requestId = response.headers['x-request-id'];

    expect(response.body.requestId).toBe(requestId);
    accessLine(warnSpy, requestId, 'POST /orders 401');
    expect(warnSpy).toHaveBeenCalledWith(`[${requestId}] 401 Unauthorized: Unauthorized`);
  });

  it('route không tồn tại (404) vẫn được log', async () => {
    const response = await request(app.getHttpServer()).get('/khong-ton-tai').expect(404);

    accessLine(warnSpy, response.headers['x-request-id'], 'GET /khong-ton-tai 404');
  });

  it('lỗi 500: log mức error kèm stack và requestId', async () => {
    prismaMock.product.findMany.mockRejectedValueOnce(new Error('DB sập'));

    const response = await request(app.getHttpServer()).get('/products').expect(500);
    const requestId = response.headers['x-request-id'];

    expect(response.body.requestId).toBe(requestId);
    expect(errorSpy).toHaveBeenCalledWith(
      `[${requestId}] Unhandled Exception: DB sập`,
      expect.stringContaining('Error: DB sập'),
    );
    accessLine(errorSpy, requestId, 'GET /products 500');
  });
});
