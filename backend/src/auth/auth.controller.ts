import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

/**
 * Controller xử lý các endpoint liên quan đến Authentication (Đăng ký, Đăng nhập)
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint Đăng ký tài khoản người dùng
   * @route POST /auth/register
   * @param registerDto Dữ liệu đăng ký gồm email và password
   * @returns HTTP 201 Created cùng thông tin user và accessToken
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<{
    user: { id: string; email: string };
    accessToken: string;
  }> {
    return this.authService.register(registerDto);
  }
}
