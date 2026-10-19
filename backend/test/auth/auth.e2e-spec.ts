import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

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
    jwtService = app.get<JwtService>(JwtService);
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

  describe('POST /auth/login', () => {
    it('trả về 200 OK cùng accessToken và expiresIn khi thông tin đăng nhập chính xác', async () => {
      const passwordHash = await bcrypt.hash('securepassword123', 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-cuid-uuid',
        email: 'customer@brewlite.vn',
        passwordHash,
      });

      const response = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'customer@brewlite.vn',
        password: 'securepassword123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        accessToken: expect.any(String),
        expiresIn: 3600,
        user: {
          id: 'user-cuid-uuid',
          email: 'customer@brewlite.vn',
        },
      });
    });

    it('trả về 401 Unauthorized khi email không tồn tại trong hệ thống', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'unknown@brewlite.vn',
        password: 'securepassword123',
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('trả về 401 Unauthorized khi mật khẩu không chính xác', async () => {
      const passwordHash = await bcrypt.hash('securepassword123', 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-cuid-uuid',
        email: 'customer@brewlite.vn',
        passwordHash,
      });

      const response = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'customer@brewlite.vn',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('trả về 401 Unauthorized khi thiếu trường email hoặc password', async () => {
      const response = await request(app.getHttpServer()).post('/auth/login').send({
        email: '',
        password: '',
      });

      expect(response.status).toBe(401);
      expect(['Unauthorized', 'Invalid credentials']).toContain(response.body.message);
    });
  });

  describe('GET /auth/me', () => {
    it('trả về 200 OK và profile người dùng khi có Bearer token hợp lệ', async () => {
      const token = await jwtService.signAsync({
        sub: 'user-cuid-uuid',
        email: 'customer@brewlite.vn',
      });

      const mockCreatedAt = new Date('2026-10-16T00:00:00.000Z');
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-cuid-uuid',
        email: 'customer@brewlite.vn',
        loyaltyPoints: 10,
        createdAt: mockCreatedAt,
      });

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 'user-cuid-uuid',
        email: 'customer@brewlite.vn',
        loyaltyPoints: 10,
        role: 'CUSTOMER',
        createdAt: mockCreatedAt.toISOString(),
      });

      // Bảo mật: Đảm bảo không bao giờ để lộ passwordHash
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('trả về 401 Unauthorized khi không gửi Authorization header (thiếu token)', async () => {
      const response = await request(app.getHttpServer()).get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('trả về 401 Unauthorized khi gửi Bearer token không hợp lệ (sai signature/format)', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(response.status).toBe(401);
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toBe('Token không hợp lệ');
    });

    it('trả về 401 Unauthorized khi token đã hết hạn', async () => {
      const expiredToken = await jwtService.signAsync(
        { sub: 'user-cuid-uuid', email: 'customer@brewlite.vn' },
        { expiresIn: '-1s' },
      );

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toBe('Token đã hết hạn');
    });
  });
});
