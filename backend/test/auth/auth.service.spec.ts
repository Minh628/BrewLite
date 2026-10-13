import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AuthService } from '../../src/auth/auth.service';
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
});
