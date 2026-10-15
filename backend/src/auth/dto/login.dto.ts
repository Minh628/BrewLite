import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object cho API Đăng nhập (POST /auth/login)
 */
export class LoginDto {
  /**
   * Email tài khoản:
   * - Bắt buộc hợp lệ chuẩn RFC 5322
   * - Tự động loại bỏ khoảng trắng và chuyển về chữ thường
   */
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  /**
   * Mật khẩu đăng nhập:
   * - Chuỗi ký tự bắt buộc
   */
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  password!: string;
}
