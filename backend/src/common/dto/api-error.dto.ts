import { ApiProperty } from '@nestjs/swagger';

/** Cấu trúc lỗi chuẩn do HttpExceptionFilter trả về */
export class ApiErrorDto {
  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Product not found',
  })
  message!: string | string[];

  @ApiProperty({ example: 'Not Found' })
  error!: string;

  @ApiProperty({ example: '/products/abc' })
  path!: string;

  @ApiProperty({ example: '2026-10-03T08:00:00.000Z' })
  timestamp!: string;
}
