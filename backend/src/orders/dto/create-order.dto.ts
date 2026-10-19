import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * DTO định nghĩa từng món trong đơn hàng do client gửi lên.
 * Áp dụng class-validator để kiểm tra định dạng dữ liệu đầu vào.
 */
export class CreateOrderItemDto {
  @IsString({ message: 'Mã sản phẩm phải là chuỗi' })
  @IsNotEmpty({ message: 'Mã sản phẩm không được để trống' })
  productId!: string;

  @IsIn(['S', 'M', 'L'], {
    message: 'Size không hợp lệ. Chỉ chấp nhận S, M hoặc L',
  })
  size!: 'S' | 'M' | 'L';

  @IsInt({ message: 'Số lượng sản phẩm phải là số nguyên' })
  @Min(1, { message: 'Số lượng sản phẩm phải là số nguyên dương' })
  qty!: number;

  @IsOptional()
  @IsArray({ message: 'Danh sách topping phải là mảng' })
  @IsString({ each: true, message: 'Mã topping phải là chuỗi' })
  toppingIds?: string[];

  // Các trường giá client có thể cố tình đính kèm nhằm gian lận giá.
  // Khai báo @IsOptional() để vượt qua ValidationPipe (forbidNonWhitelisted: true),
  // nhưng Server BẮT BUỘC bỏ qua hoàn toàn và tính lại theo DB.
  @IsOptional()
  price?: number;

  @IsOptional()
  unitPrice?: number;

  @IsOptional()
  lineTotal?: number;
}

/**
 * DTO nhận request đặt hàng từ client POST /orders
 */
export class CreateOrderDto {
  @IsArray({ message: 'Danh sách món đặt phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ArrayMinSize(1, { message: 'Danh sách món đặt không được để trống' })
  items!: CreateOrderItemDto[];

  // Trường tổng tiền client có thể cố tình gửi kèm - Server BẮT BUỘC bỏ qua
  @IsOptional()
  total?: number;
}
