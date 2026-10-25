import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Data Transfer Object cho API Đăng ký tài khoản (POST /auth/register)
 */
export class RegisterDto {
  /**
   * Email đăng ký:
   * - Bắt buộc hợp lệ chuẩn RFC 5322
   * - Tự động loại bỏ khoảng trắng dư thừa và chuyển về chữ thường để tránh lỗi trùng lặp do case-sensitivity
   */
  @ApiProperty({ example: 'customer@brewlite.vn' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  /**
   * Mật khẩu tài khoản:
   * - Tối thiểu 8 ký tự theo tiêu chuẩn bảo mật hệ thống
   */
  @ApiProperty({ example: 'Password123', minLength: 8 })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự' })
  password!: string;
}
