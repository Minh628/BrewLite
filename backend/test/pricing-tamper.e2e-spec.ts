import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Pricing Anti-Tampering & Order Integrity (e2e) [PB-21 / AT-20]', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let validToken: string;

  const testUser = {
    id: 'user-cuid-customer-1',
    email: 'customer@brewlite.vn',
  };

  // Dữ liệu mẫu đồ uống Cappuccino khớp 100% với kịch bản kiểm thử nghiệm thu AT-20:
  // BasePrice (size S) = 45.000đ; Size L (+10.000đ); Topping Trân châu (+5.000đ); Kem cheese (+7.000đ)
  // Đơn giá chuẩn = 45.000 + 10.000 + 5.000 + 7.000 = 67.000đ
  const mockCappuccino = {
    id: 'prod-cappuccino-1',
    name: 'Cappuccino',
    price: 45000,
    isActive: true,
    category: { id: 'cat-coffee', name: 'Cà phê', isActive: true },
    sizes: [
      { size: 'S', extraPrice: 0 },
      { size: 'M', extraPrice: 5000 },
      { size: 'L', extraPrice: 10000 },
    ],
    toppings: [
      {
        toppingId: 'top-pearl',
        topping: { id: 'top-pearl', name: 'Trân châu', price: 5000, isActive: true },
      },
      {
        toppingId: 'top-cheese',
        topping: { id: 'top-cheese', name: 'Kem cheese', price: 7000, isActive: true },
      },
      {
        toppingId: 'top-inactive',
        topping: { id: 'top-inactive', name: 'Thạch cà phê cũ', price: 6000, isActive: false },
      },
    ],
  };

  const prismaMock = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    topping: {
      findMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();

    // Giữ nguyên cấu hình ValidationPipe và HttpExceptionFilter đồng nhất với production (main.ts)
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
    // Tạo JWT token hợp lệ để mô phỏng người dùng đã đăng nhập thành công
    validToken = jwtService.sign({ sub: testUser.id, email: testUser.email });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Cấu hình mock transaction của Prisma: Thực thi callback truyền vào với client mock
    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      if (typeof callback === 'function') {
        return callback(prismaMock);
      }
      return callback;
    });

    // Mặc định trả về dữ liệu catalog chuẩn cho sản phẩm Cappuccino
    prismaMock.product.findMany.mockResolvedValue([mockCappuccino]);

    // Mock hàm tạo đơn hàng lưu vào database
    prismaMock.order.create.mockImplementation((args: any) => {
      return Promise.resolve({
        id: 'order-cuid-1001',
        userId: args.data.userId,
        status: args.data.status,
        total: args.data.total,
        items: args.data.items.create.map((item: any, idx: number) => ({
          id: `order-item-${idx + 1}`,
          orderId: 'order-cuid-1001',
          ...item,
        })),
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // CA KIỂM THỬ 1: TIÊU CHÍ NGHIỆM THU AT-20 (CHỐNG GIAN LẬN GIÁ TỪ CLIENT)
  // =========================================================================
  describe('Kịch bản nghiệm thu AT-20: Server tự tính lại giá từ DB, bỏ qua giá giả của Client', () => {
    it('bỏ qua toàn bộ price/unitPrice/lineTotal/total giả mạo từ client, tính lại chính xác 67.000đ x 2 = 134.000đ và trả về HTTP 201', async () => {
      // Client cố tình can thiệp giá, gửi kèm price: 1, unitPrice: 1, lineTotal: 2, total: 2
      const maliciousPayload = {
        items: [
          {
            productId: 'prod-cappuccino-1',
            size: 'L',
            toppingIds: ['top-pearl', 'top-cheese'],
            qty: 2,
            // Giá giả mạo do kẻ tấn công cố tình chèn vào payload
            price: 1,
            unitPrice: 1,
            lineTotal: 2,
          },
        ],
        total: 2, // Kẻ tấn công cố tình sửa tổng đơn thành 2đ
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${validToken}`)
        .send(maliciousPayload);

      // 1. Phản hồi HTTP 201 Created
      expect(response.status).toBe(201);

      // 2. Kiểm chứng Server bỏ qua giá giả 2đ, tự tính lại chính xác theo DB:
      // Base (45.000đ) + Size L (10.000đ) + Trân châu (5.000đ) + Kem cheese (7.000đ) = 67.000đ
      // lineTotal = 67.000đ x 2 = 134.000đ; tổng đơn hàng total = 134.000đ
      expect(response.body.total).toBe(134000);
      expect(response.body.status).toBe('PENDING');
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].lineTotal).toBe(134000);
      expect(response.body.items[0].size).toBe('L');
      expect(response.body.items[0].qty).toBe(2);

      // 3. Kiểm chứng dữ liệu ghi xuống database (Prisma Transaction) có total chính xác 134.000đ
      expect(prismaMock.order.create).toHaveBeenCalledWith({
        data: {
          userId: testUser.id,
          status: 'PENDING',
          total: 134000,
          items: {
            create: [
              {
                productId: 'prod-cappuccino-1',
                size: 'L',
                qty: 2,
                lineTotal: 134000,
                topping: 'Trân châu, Kem cheese',
              },
            ],
          },
        },
        include: {
          items: true,
        },
      });
    });
  });

  // =========================================================================
  // CA KIỂM THỬ 2: TỪ CHỐI TOPPING KHÔNG HỢP LỆ & ROLLBACK TRANSACTION
  // =========================================================================
  describe('Kịch bản Topping không hợp lệ: Ném BadRequestException (HTTP 400) & Rollback Transaction', () => {
    it('từ chối khi client gửi toppingId không tồn tại trong database hoặc không thuộc món', async () => {
      const invalidToppingPayload = {
        items: [
          {
            productId: 'prod-cappuccino-1',
            size: 'L',
            toppingIds: ['top-non-existent-id'],
            qty: 1,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidToppingPayload);

      // Kỳ vọng: HTTP 400 Bad Request
      expect(response.status).toBe(400);
      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toContain('không hợp lệ');

      // Đảm bảo không tạo bất kỳ đơn hàng nào trong database (Transaction rollback)
      expect(prismaMock.order.create).not.toHaveBeenCalled();
    });

    it('từ chối khi client chọn topping đã ngừng bán (isActive: false) và không tạo đơn hàng', async () => {
      const disabledToppingPayload = {
        items: [
          {
            productId: 'prod-cappuccino-1',
            size: 'S',
            toppingIds: ['top-inactive'], // 'top-inactive' có isActive = false
            qty: 1,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${validToken}`)
        .send(disabledToppingPayload);

      // Kỳ vọng: HTTP 400 Bad Request với thông báo rõ ràng về topping đã ngừng bán
      expect(response.status).toBe(400);
      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toContain('ngừng bán');

      // Đảm bảo rollback transaction, không có bản ghi đơn hàng nào được tạo
      expect(prismaMock.order.create).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // CA KIỂM THỬ 3: CHẶN SIZE KHÔNG HỢP LỆ QUA CLASS-VALIDATOR
  // =========================================================================
  describe('Kịch bản Size không hợp lệ: Bị ValidationPipe chặn với mã HTTP 400', () => {
    it('từ chối khi client gửi size không thuộc danh sách cho phép (S, M, L)', async () => {
      const invalidSizePayload = {
        items: [
          {
            productId: 'prod-cappuccino-1',
            size: 'XL', // Size không hợp lệ
            qty: 1,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidSizePayload);

      // Bị chặn ngay từ tầng ValidationPipe
      expect(response.status).toBe(400);
      expect(response.body.statusCode).toBe(400);
      // Thông báo lỗi chuẩn từ class-validator
      const messageStr = Array.isArray(response.body.message)
        ? response.body.message.join('; ')
        : response.body.message;
      expect(messageStr).toMatch(/Size không hợp lệ/);

      // Không gọi xuống service hay database
      expect(prismaMock.order.create).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // CA KIỂM THỬ BỔ SUNG: BẢO MẬT XÁC THỰC (JWT AUTH GUARD)
  // =========================================================================
  describe('Kịch bản Bảo mật Xác thực: Yêu cầu Bearer Token hợp lệ', () => {
    it('trả về HTTP 401 Unauthorized khi gửi request POST /orders mà không kèm Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          items: [
            {
              productId: 'prod-cappuccino-1',
              size: 'S',
              qty: 1,
            },
          ],
        });

      expect(response.status).toBe(401);
      expect(prismaMock.order.create).not.toHaveBeenCalled();
    });
  });
});
