import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser, CurrentUserPayload } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

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

  /**
   * Endpoint Đăng nhập người dùng và cấp JWT accessToken
   * @route POST /auth/login
   * @param req Request chứa user context do LocalStrategy xác thực
   * @param _loginDto Payload đăng nhập để ValidationPipe kiểm tra định dạng
   * @returns HTTP 200 OK cùng accessToken, expiresIn và thông tin user
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req: { user: { id: string; email: string } },
    @Body() _loginDto: LoginDto,
  ): Promise<{
    accessToken: string;
    expiresIn: number;
    user: { id: string; email: string };
  }> {
    return this.authService.login(req.user);
  }

  /**
   * Endpoint lấy thông tin profile của người dùng hiện tại
   * @route GET /auth/me
   * @param user Thông tin user trích xuất từ JWT Bearer token qua @CurrentUser() decorator
   * @returns HTTP 200 OK cùng thông tin an toàn (id, email, loyaltyPoints, role, createdAt)
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user.id);
  }
}
