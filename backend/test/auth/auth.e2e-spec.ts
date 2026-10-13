import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Auth API (e2e)', () => {
  let app: INestApplication;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('trả về 201 Created và accessToken khi thông tin đăng ký hợp lệ', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation((args: { data: { email: string } }) => {
        return Promise.resolve({
          id: 'user-cuid-uuid',
          email: args.data.email,
        });
      });

      const response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'customer@brewlite.vn',
        password: 'securepassword123',
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        user: {
          id: 'user-cuid-uuid',
          email: 'customer@brewlite.vn',
        },
        accessToken: expect.any(String),
      });

      // Bảo mật: Đảm bảo response không bao giờ để lộ passwordHash
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('tự động lowercase và trim email trước khi xử lý lưu trữ', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'user-cuid-trim',
        email: 'customer@brewlite.vn',
      });

      const response = await request(app.getHttpServer()).post('/auth/register').send({
        email: '  CUSTOMER@BrewLite.vn  ',
        password: 'securepassword123',
      });

      expect(response.status).toBe(201);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'customer@brewlite.vn' },
        select: { id: true },
      });
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'customer@brewlite.vn',
          }),
        }),
      );
    });

    it('trả về 409 Conflict khi email đã tồn tại', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      const response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'customer@brewlite.vn',
        password: 'securepassword123',
      });

      expect(response.status).toBe(409);
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 409,
          message: 'Email already registered',
          error: 'Conflict',
        }),
      );
    });

    it('trả về 400 Bad Request khi email không đúng định dạng', async () => {
      const response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'not-an-email',
        password: 'securepassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email không đúng định dạng');
    });

    it('trả về 400 Bad Request khi mật khẩu ít hơn 8 ký tự', async () => {
      const response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'customer@brewlite.vn',
        password: 'short',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Mật khẩu phải có độ dài tối thiểu 8 ký tự');
    });

    it('trả về 400 Bad Request khi gửi kèm các field không xác định (forbidNonWhitelisted)', async () => {
      const response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'customer@brewlite.vn',
        password: 'securepassword123',
        role: 'ADMIN', // Field lạ không được phép
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('property role should not exist');
    });
  });
});
