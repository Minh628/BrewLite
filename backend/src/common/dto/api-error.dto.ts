import { ApiProperty } from '@nestjs/swagger';

/** Cấu trúc lỗi chuẩn do HttpExceptionFilter trả về */
export class ApiErrorDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['items.0.qty tối đa là 20'],
  })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({ example: '/orders' })
  path!: string;

  @ApiProperty({ example: '2026-10-24T10:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({
    description: 'Trùng header X-Request-Id, dùng để tìm dòng log tương ứng',
    example: '0b6f8a52-3f7c-4a5e-9d0e-6f1c2b7a9e11',
  })
  requestId!: string;
}
