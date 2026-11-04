import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

/**
 * Payload POST /promotions/validate (contract v3).
 * `code` được trim + IN HOA để khớp mã trong DB; không phân biệt hoa thường.
 */
export class ValidatePromotionDto {
  @ApiProperty({ example: 'brew10', description: 'Không phân biệt hoa thường' })
  @IsNotEmpty({ message: 'code không được để trống' })
  @IsString({ message: 'code phải là chuỗi' })
  @MaxLength(64, { message: 'code tối đa 64 ký tự' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code!: string;

  @ApiProperty({ example: 178000, minimum: 0, description: 'Tạm tính hiện tại (VND)' })
  @IsNotEmpty({ message: 'subtotal không được để trống' })
  @IsInt({ message: 'subtotal phải là số nguyên' })
  @Min(0, { message: 'subtotal không được âm' })
  subtotal!: number;
}

/**
 * Phản hồi 200 của POST /promotions/validate (contract v3).
 */
export class ValidatedPromotionDto {
  @ApiProperty({ example: 'BREW10' })
  code!: string;

  @ApiProperty({ example: 17800, description: 'Số tiền được giảm (VND)' })
  discount!: number;
}
