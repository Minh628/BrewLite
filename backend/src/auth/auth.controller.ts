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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { BEARER_AUTH } from '../swagger';
import { AuthService } from './auth.service';
import { CurrentUser, CurrentUserPayload } from './decorators/current-user.decorator';
import { LoginResponseDto, ProfileDto, RegisterResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

/**
 * Controller xử lý các endpoint liên quan đến Authentication (Đăng ký, Đăng nhập)
 */
@ApiTags('Auth')
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
  @ApiOperation({ summary: 'Đăng ký tài khoản và nhận accessToken' })
  @ApiCreatedResponse({ type: RegisterResponseDto })
  @ApiBadRequestResponse({
    type: ApiErrorDto,
    description: 'Email sai định dạng, mật khẩu < 8 ký tự',
  })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'Email đã được đăng ký' })
  async register(@Body() registerDto: RegisterDto): Promise<{
    user: { id: number; email: string };
    accessToken: string;
  }> {
    return this.authService.register(registerDto);
  }

  /**
   * Endpoint Đăng nhập người dùng và cấp JWT accessToken
   * Giới hạn rate-limit chống brute-force: tối đa 5 requests trong 60 giây (AT-22)
   * @route POST /auth/login
   * @param req Request chứa user context do LocalStrategy xác thực
   * @param _loginDto Payload đăng nhập để ValidationPipe kiểm tra định dạng
   * @returns HTTP 200 OK cùng accessToken, expiresIn và thông tin user
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng nhập lấy accessToken (JWT 1 giờ)',
    description: 'Copy accessToken, bấm nút Authorize ở đầu trang để gọi các route cần đăng nhập.',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto, description: 'Sai email hoặc mật khẩu' })
  @ApiTooManyRequestsResponse({ type: ApiErrorDto, description: 'Quá 5 lần/phút' })
  async login(
    @Request() req: { user: { id: number; email: string } },
    @Body() _loginDto: LoginDto,
  ): Promise<{
    accessToken: string;
    expiresIn: number;
    user: { id: number; email: string };
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
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({ summary: 'Thông tin người dùng hiện tại' })
  @ApiOkResponse({ type: ProfileDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto, description: 'Thiếu, sai hoặc hết hạn token' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user.id);
  }
}
