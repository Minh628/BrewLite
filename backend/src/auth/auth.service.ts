import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

/**
 * Service xử lý logic xác thực và ủy quyền tài khoản người dùng
 */
@Injectable()
export class AuthService {
  // Số vòng salt băm mật khẩu: 10 là mốc tối ưu giữa tính an toàn (OWASP) và hiệu năng CPU
  private readonly BCRYPT_SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Đăng ký tài khoản người dùng mới:
   * 1. Fast Pre-check: Kiểm tra email trước để tiết kiệm chu kỳ băm bcrypt nếu đã tồn tại.
   * 2. Băm mật khẩu bằng bcrypt.
   * 3. Lưu vào Database với Prisma select chỉ định (bảo vệ bộ nhớ, không bao giờ load passwordHash).
   * 4. Bắt lỗi P2002 (Unique constraint) để giải quyết triệt để race condition khi có 2 request đến cùng lúc.
   * 5. Ký và phát hành ngay accessToken JWT.
   */
  async register(dto: RegisterDto): Promise<{
    user: { id: string; email: string };
    accessToken: string;
  }> {
    // Bước 1: Fast Pre-check bảo vệ tài nguyên tính toán của CPU
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Bước 2: Băm mật khẩu người dùng
    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_SALT_ROUNDS);

    // Bước 3: Tạo bản ghi người dùng với select chỉ lấy các trường an toàn
    let user: { id: string; email: string };
    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          loyaltyPoints: 0,
        },
        select: {
          id: true,
          email: true,
        },
      });
    } catch (error) {
      // Bước 4: Xử lý race condition (nano-giây cuối) bắt mã lỗi vi phạm unique key từ Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }

    // Bước 5: Ký JWT chứa thông tin định danh
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      accessToken,
    };
  }
}
