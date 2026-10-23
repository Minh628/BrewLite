import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthService (Unit Test)', () => {
  let service: AuthService;

  // Mock PrismaService chứa các bảng cần thiết
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  // Mock JwtService với signAsync
  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prismaMock as unknown as PrismaService,
      jwtServiceMock as unknown as JwtService,
    );
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@brewlite.vn',
      password: 'password123',
    };

    it('đăng ký thành công: băm mật khẩu qua bcrypt, lưu user vào DB (loyaltyPoints 0), trả về { user: { id, email }, accessToken } và không bao giờ chứa passwordHash', async () => {
      // Mock: Email chưa tồn tại ở Fast Pre-check
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Mock: Tạo user thành công trong DB
      const createdUser = {
        id: 3,
        email: 'test@brewlite.vn',
      };
      prismaMock.user.create.mockResolvedValue(createdUser);

      // Mock: JWT signAsync tạo token thành công
      jwtServiceMock.signAsync.mockResolvedValue('jwt-mock-token-xyz');

      const hashSpy = jest.spyOn(bcrypt, 'hash');

      const result = await service.register(registerDto);

      // Đảm bảo mật khẩu được băm bằng bcrypt với salt rounds = 10
      expect(hashSpy).toHaveBeenCalledWith('password123', 10);

      // Đảm bảo tạo bản ghi với loyaltyPoints = 0
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@brewlite.vn',
          passwordHash: expect.any(String),
          loyaltyPoints: 0,
        }),
        select: {
          id: true,
          email: true,
        },
      });

      // Đảm bảo ký JWT với payload sub và email
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: '3',
        email: 'test@brewlite.vn',
      });

      // Kiểm tra dữ liệu trả về chuẩn format
      expect(result).toEqual({
        user: {
          id: 3,
          email: 'test@brewlite.vn',
        },
        accessToken: 'jwt-mock-token-xyz',
      });

      // Bảo mật tối cao: Không bao giờ trả về passwordHash
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('ném ConflictException (409) với message "Email already registered" khi email đã tồn tại ở bước Fast Pre-check', async () => {
      // Giả lập tìm thấy user trùng email
      prismaMock.user.findUnique.mockResolvedValue({ id: 3 });
      const hashSpy = jest.spyOn(bcrypt, 'hash');

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email already registered'),
      );

      // Fast Pre-check bảo vệ tài nguyên: không gọi hàm băm bcrypt nếu email đã trùng
      expect(hashSpy).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('bắt lỗi PrismaClientKnownRequestError P2002 và ném ConflictException (409) với message "Email already registered"', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Giả lập lỗi vi phạm unique constraint mã P2002 từ Prisma Client
      const prismaUniqueError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        {
          code: 'P2002',
          clientVersion: '6.14.0',
        },
      );
      prismaMock.user.create.mockRejectedValue(prismaUniqueError);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email already registered'),
      );
    });

    it('ném lại lỗi (re-throw) khi Prisma gặp lỗi không mong muốn khác', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const databaseCrashError = new Error('Database connection failed unexpectedly');
      prismaMock.user.create.mockRejectedValue(databaseCrashError);

      await expect(service.register(registerDto)).rejects.toThrow(
        'Database connection failed unexpectedly',
      );
    });
  });

  describe('validateUser', () => {
    const rawPassword = 'plainPassword123';

    it('trả về user context an toàn khi email và mật khẩu chính xác', async () => {
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 3,
        email: 'test@brewlite.vn',
        passwordHash: hashedPassword,
      });

      const user = await service.validateUser('test@brewlite.vn', rawPassword);

      expect(user).toEqual({
        id: 3,
        email: 'test@brewlite.vn',
      });
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('chạy dummy compare chống timing attack và trả về null khi không tìm thấy user theo email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const compareSpy = jest.spyOn(bcrypt, 'compare');

      const user = await service.validateUser('notfound@brewlite.vn', rawPassword);

      expect(user).toBeNull();
      // Phải gọi so sánh chuỗi hash giả lập để độ trễ đồng nhất (phòng chống timing attack)
      expect(compareSpy).toHaveBeenCalledWith(rawPassword, expect.stringContaining('$2b$10$'));
    });

    it('trả về null khi mật khẩu không khớp', async () => {
      const hashedPassword = await bcrypt.hash('correctPassword123', 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 3,
        email: 'test@brewlite.vn',
        passwordHash: hashedPassword,
      });

      const user = await service.validateUser('test@brewlite.vn', 'wrongPassword');

      expect(user).toBeNull();
    });
  });

  describe('login', () => {
    const validUserContext = {
      id: 3,
      email: 'test@brewlite.vn',
    };

    it('đăng nhập thành công: trả về accessToken, expiresIn: 3600 và user context', async () => {
      jwtServiceMock.signAsync.mockResolvedValue('jwt-login-access-token');

      const result = await service.login(validUserContext);

      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: '3',
        email: 'test@brewlite.vn',
      });

      expect(result).toEqual({
        accessToken: 'jwt-login-access-token',
        expiresIn: 3600,
        user: {
          id: 3,
          email: 'test@brewlite.vn',
        },
      });
    });

    it('đăng nhập thất bại: ném UnauthorizedException (401) với message chung "Invalid credentials" khi user context null hoặc rỗng', async () => {
      await expect(service.login(null as unknown as { id: number; email: string })).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(service.login({ id: 0, email: '' })).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(service.login({ id: 3, email: '' })).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(service.login({ id: 0, email: 'test@brewlite.vn' })).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });

  describe('getProfile', () => {
    it('lấy profile thành công: trả về thông tin user (id, email, loyaltyPoints, role, createdAt) và không bao giờ chứa passwordHash', async () => {
      const mockCreatedAt = new Date('2026-10-16T00:00:00.000Z');
      prismaMock.user.findUnique.mockResolvedValue({
        id: 3,
        email: 'an@brewlite.vn',
        loyaltyPoints: 100,
        createdAt: mockCreatedAt,
      });

      const profile = await service.getProfile(3);

      expect(profile).toEqual({
        id: 3,
        email: 'an@brewlite.vn',
        loyaltyPoints: 100,
        role: 'CUSTOMER',
        createdAt: mockCreatedAt,
      });

      // Bảo mật tuyệt đối: Không trả về passwordHash
      expect(profile).not.toHaveProperty('passwordHash');

      // Đảm bảo sử dụng Prisma select whitelisting để tiết kiệm RAM
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 3 },
        select: {
          id: true,
          email: true,
          loyaltyPoints: true,
          createdAt: true,
        },
      });
    });

    it('ném UnauthorizedException (401) với message "User not found" khi userId không tồn tại trong CSDL', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(999999)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });
  });
});
