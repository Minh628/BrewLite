import { ApiProperty } from '@nestjs/swagger';

/** Các schema phản hồi của /auth/*, chỉ dùng cho tài liệu Swagger (PB-16) */
export class AuthUserDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 'customer@brewlite.vn' })
  email!: string;
}

export class RegisterResponseDto {
  @ApiProperty({ type: () => AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  accessToken!: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  accessToken!: string;

  @ApiProperty({ description: 'Thời hạn token (giây)', example: 3600 })
  expiresIn!: number;

  @ApiProperty({ type: () => AuthUserDto })
  user!: AuthUserDto;
}

export class ProfileDto extends AuthUserDto {
  @ApiProperty({ example: 0 })
  loyaltyPoints!: number;

  @ApiProperty({ example: 'CUSTOMER' })
  role!: string;

  @ApiProperty({ example: '2026-10-12T10:00:00.000Z' })
  createdAt!: Date;
}
