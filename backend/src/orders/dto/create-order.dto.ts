import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  Allow,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export const ORDER_SIZES = ['S', 'M', 'L'] as const;
export type OrderSize = (typeof ORDER_SIZES)[number];

export const MIN_QTY = 1;
export const MAX_QTY = 20;

/**
 * Một dòng món trong giỏ hàng gửi lên POST /orders (Sub-task 6.1)
 */
export class CreateOrderItemDto {
  /** Mã sản phẩm: số nguyên dương; tồn tại và đang bán được kiểm tra ở OrdersService */
  @ApiProperty({ example: 3, minimum: 1 })
  @IsDefined({ message: 'productId không được để trống' })
  @IsInt({ message: 'productId phải là số nguyên' })
  @Min(1, { message: 'productId phải là số nguyên dương' })
  productId!: number;

  /** Size đồ uống: chỉ chấp nhận S, M hoặc L */
  @ApiProperty({ enum: ORDER_SIZES, example: 'L' })
  @IsDefined({ message: 'size không được để trống' })
  @IsIn(ORDER_SIZES, { message: 'size phải là một trong các giá trị: S, M, L' })
  size!: OrderSize;

  /** Số lượng mỗi dòng: 1–20 */
  @ApiProperty({ example: 2, minimum: MIN_QTY, maximum: MAX_QTY })
  @IsDefined({ message: 'qty không được để trống' })
  @IsInt({ message: 'qty phải là số nguyên' })
  @Min(MIN_QTY, { message: `qty tối thiểu là ${MIN_QTY}` })
  @Max(MAX_QTY, { message: `qty tối đa là ${MAX_QTY}` })
  qty!: number;

  /** Danh sách mã topping: mảng số nguyên dương, không trùng lặp */
  @ApiPropertyOptional({ type: [Number], example: [1, 2], uniqueItems: true })
  @IsOptional()
  @IsArray({ message: 'toppingIds phải là một mảng' })
  @ArrayUnique({ message: 'toppingIds không được chứa giá trị trùng lặp' })
  @IsInt({ each: true, message: 'Mỗi phần tử của toppingIds phải là số nguyên' })
  @Min(1, { each: true, message: 'Mỗi phần tử của toppingIds phải là số nguyên dương' })
  toppingIds?: number[];

  /**
   * Các trường giá client có thể gửi kèm (giỏ hàng FE có lưu giá).
   * Được whitelist để không bị forbidNonWhitelisted từ chối, nhưng server BỎ QUA hoàn toàn (PB-21).
   */
  @ApiHideProperty()
  @Allow()
  price?: unknown;

  @ApiHideProperty()
  @Allow()
  unitPrice?: unknown;

  @ApiHideProperty()
  @Allow()
  lineTotal?: unknown;
}

/**
 * Payload POST /orders theo API contract v2 (Sub-task 6.1)
 */
export class CreateOrderDto {
  @ApiProperty({ type: () => [CreateOrderItemDto], minItems: 1 })
  @IsDefined({ message: 'items không được để trống' })
  @IsArray({ message: 'items phải là một mảng' })
  @ArrayMinSize(1, { message: 'items phải có ít nhất 1 món' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  /** Tổng tiền client tự tính (nếu có) - server bỏ qua, tự tính lại qua PricingService */
  @ApiHideProperty()
  @Allow()
  total?: unknown;
}
