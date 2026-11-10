
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let queryRawMock: jest.Mock;

  beforeAll(async () => {
    queryRawMock = jest.fn().mockResolvedValue([{ '?column?': 1 }]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        $queryRaw: queryRawMock,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    queryRawMock.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('GET /health trả về 200 OK và thông tin trạng thái', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('service', 'brewlite-backend');
    expect(response.body).toHaveProperty('database', 'connected');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('version');
  });

  it('GET /health trả đúng BUILD_VERSION', async () => {
    const originalVersion = process.env.BUILD_VERSION;
    process.env.BUILD_VERSION = '2.5.0';

    try {
      const response = await request(app.getHttpServer()).get('/health').expect(200);
      expect(response.body.version).toBe('2.5.0');
    } finally {
      if (originalVersion === undefined) {
        delete process.env.BUILD_VERSION;
      } else {
        process.env.BUILD_VERSION = originalVersion;
      }
    }
  });

  it('GET /health trả 503 khi database mất kết nối', async () => {
    queryRawMock.mockRejectedValueOnce(new Error('Database connection failed'));

    const response = await request(app.getHttpServer()).get('/health').expect(503);

    expect(response.body).toMatchObject({
      status: 'error',
      database: 'disconnected',
    });
  });

  it('GET / trả về Hello BrewLite', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.text).toBe('Hello BrewLite');
  });
});
