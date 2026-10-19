import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AuthService } from '../../src/auth/auth.service';
import { LocalStrategy } from '../../src/auth/strategies/local.strategy';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

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
    const registerDto = {
      email: 'test@brewlite.vn',
      password: 'password123',
    };

    it('đăng ký thành công và phát hành accessToken', async () => {
      // Mock: Chưa tồn tại người dùng với email này
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Mock: Tạo người dùng thành công trong CSDL
      const createdUser = {
        id: 'user-cuid-123',
        email: 'test@brewlite.vn',
      };
      prismaMock.user.create.mockResolvedValue(createdUser);

      // Mock: JWT signAsync tạo token thành công
      jwtServiceMock.signAsync.mockResolvedValue('jwt-mock-token-xyz');

      const result = await service.register(registerDto);

      // Kiểm tra cấu trúc dữ liệu trả về đúng chuẩn
      expect(result).toEqual({
        user: {
          id: 'user-cuid-123',
          email: 'test@brewlite.vn',
        },
        accessToken: 'jwt-mock-token-xyz',
      });

      // Đảm bảo tuyệt đối không trả về passwordHash
      expect(result.user).not.toHaveProperty('passwordHash');

      // Đảm bảo gọi findUnique trước để fast pre-check
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@brewlite.vn' },
        select: { id: true },
      });

      // Đảm bảo gọi create với mật khẩu đã được băm
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

      // Đảm bảo ký JWT với đúng payload
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: 'user-cuid-123',
        email: 'test@brewlite.vn',
      });
    });

    it('ném lỗi ConflictException (409) ngay tại Fast Pre-check khi email đã tồn tại', async () => {
      // Giả lập email đã tồn tại trong DB
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-id' });
      const hashSpy = jest.spyOn(bcrypt, 'hash');

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email already registered'),
      );

      // Fast Pre-check phải ngăn chặn việc tính toán bcrypt để bảo vệ CPU
      expect(hashSpy).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });

    it('bắt lỗi Prisma P2002 và ném ConflictException khi gặp race condition tại lúc tạo user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Giả lập lỗi vi phạm ràng buộc Unique P2002 từ Prisma Client
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

    it('ném lại lỗi nếu gặp lỗi CSDL khác ngoài P2002', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const dbError = new Error('Database connection failed');
      prismaMock.user.create.mockRejectedValue(dbError);

      await expect(service.register(registerDto)).rejects.toThrow('Database connection failed');
    });
  });

  describe('validateUser', () => {
    it('trả về user context khi email và mật khẩu chính xác', async () => {
      const mockUser = {
        id: 'user-cuid-123',
        email: 'test@brewlite.vn',
        passwordHash: '$2b$10$hashedpassword',
      };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.validateUser('test@brewlite.vn', 'password123');

      expect(result).toEqual({
        id: 'user-cuid-123',
        email: 'test@brewlite.vn',
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@brewlite.vn' },
        select: { id: true, email: true, passwordHash: true },
      });
    });

    it('trả về null và thực hiện dummy compare khi không tìm thấy email (chống Timing Attack)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const compareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      const result = await service.validateUser('notfound@brewlite.vn', 'password123');

      expect(result).toBeNull();
      // Đảm bảo bcrypt.compare vẫn được gọi để tránh timing attack
      expect(compareSpy).toHaveBeenCalled();
    });

    it('trả về null khi mật khẩu không khớp', async () => {
      const mockUser = {
        id: 'user-cuid-123',
        email: 'test@brewlite.vn',
        passwordHash: '$2b$10$hashedpassword',
      };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const result = await service.validateUser('test@brewlite.vn', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('phát hành accessToken JWT và trả về đúng JSON contract', async () => {
      jwtServiceMock.signAsync.mockResolvedValue('jwt-mock-access-token');

      const user = {
        id: 'user-cuid-123',
        email: 'test@brewlite.vn',
      };

      const result = await service.login(user);

      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: 'user-cuid-123',
        email: 'test@brewlite.vn',
      });
      expect(result).toEqual({
        accessToken: 'jwt-mock-access-token',
        expiresIn: 3600,
        user: {
          id: 'user-cuid-123',
          email: 'test@brewlite.vn',
        },
      });
    });

    it('ném lỗi UnauthorizedException (401) khi user context rỗng hoặc không hợp lệ', async () => {
      await expect(service.login(null as unknown as { id: string; email: string })).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(service.login({ id: '', email: '' })).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });

  describe('getProfile', () => {
    it('trả về thông tin profile thành công và không chứa passwordHash', async () => {
      const mockCreatedAt = new Date('2026-10-16T00:00:00.000Z');
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-cuid-123',
        email: 'an@brewlite.vn',
        loyaltyPoints: 100,
        createdAt: mockCreatedAt,
      });

      const profile = await service.getProfile('user-cuid-123');

      expect(profile).toEqual({
        id: 'user-cuid-123',
        email: 'an@brewlite.vn',
        loyaltyPoints: 100,
        role: 'CUSTOMER',
        createdAt: mockCreatedAt,
      });

      // Bảo mật: Đảm bảo không tồn tại passwordHash trong profile
      expect(profile).not.toHaveProperty('passwordHash');

      // Đảm bảo truy vấn findUnique chỉ định select an toàn để tiết kiệm RAM
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-cuid-123' },
        select: {
          id: true,
          email: true,
          loyaltyPoints: true,
          createdAt: true,
        },
      });
    });

    it('ném lỗi UnauthorizedException khi userId không tồn tại trong CSDL', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent-user-id')).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });
  });

  describe('LocalStrategy', () => {
    let localStrategy: LocalStrategy;

    beforeEach(() => {
      localStrategy = new LocalStrategy(service);
    });

    it('xác thực thành công và trả về user khi thông tin đăng nhập đúng', async () => {
      const mockUser = { id: 'user-cuid-123', email: 'test@brewlite.vn' };
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);

      const result = await localStrategy.validate('test@brewlite.vn', 'password123');
      expect(result).toEqual(mockUser);
    });

    it('ném lỗi UnauthorizedException (401) khi email hoặc password bị rỗng', async () => {
      await expect(localStrategy.validate('', 'password123')).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      await expect(localStrategy.validate('test@brewlite.vn', '')).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('ném lỗi UnauthorizedException (401) khi validateUser trả về null (sai email/password)', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(localStrategy.validate('test@brewlite.vn', 'wrongpassword')).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });
});
