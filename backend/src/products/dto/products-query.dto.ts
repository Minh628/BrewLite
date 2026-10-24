import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** Tham số rỗng (`?category=`) được coi như không truyền, để tab "Tất cả" của FE gửi được */
const emptyToUndefined = (raw: unknown): unknown =>
  typeof raw === 'string' && raw.trim() === '' ? undefined : raw;

/**
 * Query của GET /products?category=&q= theo API contract v2 (Sub-task 18.1)
 */
export class ProductsQueryDto {
  /** Mã danh mục cần lọc */
  @IsOptional()
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    const raw = emptyToUndefined(obj[key]);
    return raw === undefined ? undefined : Number(raw);
  })
  @IsInt({ message: 'category phải là số nguyên' })
  @Min(1, { message: 'category phải là số nguyên dương' })
  category?: number;

  /** Từ khóa tìm theo tên, không phân biệt hoa/thường và dấu tiếng Việt */
  @IsOptional()
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    const raw = emptyToUndefined(obj[key]);
    return typeof raw === 'string' ? raw.trim() : raw;
  })
  @IsString({ message: 'q phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'q tối đa 100 ký tự' })
  q?: string;
}
