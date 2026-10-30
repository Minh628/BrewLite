import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
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
    user: { id: number; email: string };
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
    let user: { id: number; email: string };
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
      sub: String(user.id),
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

  /**
   * So khớp email và mật khẩu của người dùng:
   * - Sử dụng bcrypt.compare để xác minh mật khẩu
   * - Cơ chế Dummy Compare: chạy so sánh băm giả khi không tìm thấy user nhằm
   *   phòng ngừa tấn công đo thời gian (Timing Attack / User Enumeration)
   * @param email Email đăng nhập
   * @param pass Mật khẩu chưa băm
   * @returns Thông tin user context an toàn nếu khớp, ngược lại trả về null
   */
  async validateUser(email: string, pass: string): Promise<{ id: number; email: string } | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      // Chạy băm giả để độ trễ ngang bằng trường hợp có user (chống timing attack)
      await bcrypt.compare(pass, '$2b$10$e8k57v6K1wK4b0m1V4E.5O1b1e8k57v6K1wK4b0m1V4E.5O1b1e8k');
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
    };
  }

  /**
   * Phát hành JWT access token khi người dùng đăng nhập thành công
   * @param user Thông tin user đã được xác thực qua LocalStrategy
   * @returns Đối tượng chứa accessToken, expiresIn (3600s) và user context
   */
  async login(user: { id: number; email: string }): Promise<{
    accessToken: string;
    expiresIn: number;
    user: { id: number; email: string };
  }> {
    if (!user || !user.id || !user.email) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: String(user.id),
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  /**
   * Lấy thông tin hồ sơ người dùng theo userId
   * - Truy vấn Prisma chỉ chọn các trường an toàn (id, email, loyaltyPoints, createdAt)
   * - Tuyệt đối không nạp passwordHash vào bộ nhớ để đảm bảo tính an toàn dữ liệu và tối ưu RAM
   * - Ném UnauthorizedException nếu không tìm thấy bản ghi user trong CSDL
   * @param userId Định danh người dùng
   * @returns Thông tin profile chuẩn hóa của người dùng
   */
  async getProfile(userId: number): Promise<{
    id: number;
    email: string;
    loyaltyPoints: number;
    role: string;
    createdAt: Date;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      loyaltyPoints: user.loyaltyPoints,
      role: 'CUSTOMER',
      createdAt: user.createdAt,
    };
  }
}
