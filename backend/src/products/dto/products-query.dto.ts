
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const emptyToUndefined = (raw: unknown): unknown =>
  typeof raw === 'string' && raw.trim() === '' ? undefined : raw;

/**
 * Query của GET /products?category=&q=
 */
export class ProductsQueryDto {
  @ApiPropertyOptional({
    description: 'Mã danh mục (GET /categories)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    const raw = emptyToUndefined(obj[key]);
    return raw === undefined ? undefined : Number(raw);
  })
  @IsInt({ message: 'category phải là số nguyên' })
  @Min(1, { message: 'category phải là số nguyên dương' })
  category?: number;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm theo tên sản phẩm, không phân biệt hoa thường',
    example: 'ca phe sua',
    maxLength: 100,
  })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString({ message: 'q phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'q tối đa 100 ký tự' })
  q?: string;
}
