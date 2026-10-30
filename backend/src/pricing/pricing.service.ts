import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type Size = 'S' | 'M' | 'L';

export type AvailableSize = {
  size: Size;
  extraPrice: number;
};

export type SelectedTopping = {
  price: number;
  [key: string]: unknown;
};

/**
 * Tính đơn giá một sản phẩm (chưa nhân số lượng).
 * Đảm bảo logic và ca kiểm thử khớp 100% với hàm calcUnitPrice ở FE (frontend/src/lib/pricing.ts).
 *
 * @param base Giá gốc size S của sản phẩm (VND)
 * @param size Cấu hình size đã chọn và phụ thu
 * @param toppings Danh sách topping được chọn kèm giá
 */
export function calcUnitPrice(
  base: number,
  size: AvailableSize,
  toppings: readonly SelectedTopping[],
): number {
  if (!Number.isFinite(base) || base < 0) {
    throw new RangeError('Giá gốc không hợp lệ');
  }

  if (!['S', 'M', 'L'].includes(size.size)) {
    throw new RangeError('Size không hợp lệ');
  }

  if (!Number.isFinite(size.extraPrice) || size.extraPrice < 0) {
    throw new RangeError('Phụ thu size không hợp lệ');
  }

  const toppingTotal = toppings.reduce((total, topping) => {
    if (!Number.isFinite(topping.price) || topping.price < 0) {
      throw new RangeError('Giá topping không hợp lệ');
    }

    return total + topping.price;
  }, 0);

  return Math.round(base + size.extraPrice + toppingTotal);
}

/**
 * Dữ liệu món hàng do client gửi lên.
 * Lưu ý: Mọi trường giá do client gửi (nếu có cố tình đính kèm) đều bị bỏ qua hoàn toàn.
 */
export interface OrderItemPricingInput {
  productId: number;
  size: Size;
  toppingIds?: number[];
  qty: number;
  /** Giá giả mạo do client gửi (nếu có) - Server BẮT BUỘC bỏ qua */
  clientPrice?: number;
  clientUnitPrice?: number;
  clientLineTotal?: number;
}

export interface OrderItemToppingSnapshot {
  toppingId: number;
  toppingName: string;
  price: number;
}

export interface OrderItemPricingSnapshot {
  productId: number;
  productName: string;
  size: Size;
  basePrice: number;
  sizeExtra: number;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  toppings: OrderItemToppingSnapshot[];
}

export interface OrderPricingResult {
  subtotal: number;
  discountAmount: number;
  total: number;
  items: OrderItemPricingSnapshot[];
}

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Wrapper gọi hàm thuần túy calcUnitPrice phục vụ kiểm thử và tái sử dụng nội bộ
   */
  calcUnitPrice(base: number, size: AvailableSize, toppings: readonly SelectedTopping[]): number {
    return calcUnitPrice(base, size, toppings);
  }

  /**
   * Tính toán lại toàn bộ đơn giá và tổng tiền cho đơn hàng.
   * QUY TẮC BẢO MẬT: Bỏ qua hoàn toàn giá do client gửi, truy vấn dữ liệu từ DB để làm nguồn sự thật (Source of Truth).
   */
  async calculateOrderPricing(items: OrderItemPricingInput[]): Promise<OrderPricingResult> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Danh sách món đặt không được để trống');
    }

    // 1. Kiểm tra định dạng sơ bộ từng món trước khi truy vấn DB
    for (const item of items) {
      if (
        !item.productId ||
        typeof item.productId !== 'number' ||
        !Number.isInteger(item.productId) ||
        item.productId <= 0
      ) {
        throw new BadRequestException('Mã sản phẩm không hợp lệ');
      }

      if (!Number.isInteger(item.qty) || item.qty <= 0) {
        throw new BadRequestException('Số lượng sản phẩm phải là số nguyên dương');
      }

      if (!['S', 'M', 'L'].includes(item.size)) {
        throw new BadRequestException(
          `Size '${item.size}' không hợp lệ. Chỉ chấp nhận S, M hoặc L`,
        );
      }

      // Kiểm tra không cho phép chọn trùng topping trong cùng một món
      if (item.toppingIds && item.toppingIds.length > 0) {
        const uniqueToppingIds = new Set(item.toppingIds);
        if (uniqueToppingIds.size !== item.toppingIds.length) {
          throw new BadRequestException('Topping không được chọn trùng lặp trong cùng một món');
        }
      }
    }

    // 2. Batch query lấy thông tin các sản phẩm từ database (chống N+1 query)
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
        category: { isActive: true },
      },
      include: {
        sizes: true,
        toppings: {
          include: {
            topping: true,
          },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 3. Tiến hành đối soát nghiệp vụ và tính toán giá cho từng món
    const pricedItems: OrderItemPricingSnapshot[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(
          `Sản phẩm với mã '${item.productId}' không tồn tại hoặc đã ngừng kinh doanh`,
        );
      }

      // Kiểm tra món có cấu hình size mà khách chọn hay không
      const sizeConfig = product.sizes.find((s) => s.size === item.size);
      if (!sizeConfig) {
        throw new BadRequestException(
          `Sản phẩm '${product.name}' không hỗ trợ size '${item.size}'`,
        );
      }

      // Kiểm tra và lấy thông tin topping hợp lệ của món
      const toppingSnapshots: OrderItemToppingSnapshot[] = [];
      const requestedToppingIds = item.toppingIds || [];

      if (requestedToppingIds.length > 0) {
        // Tạo bảng tra cứu các topping được phép gán cho món này và đang hoạt động
        const allowedToppingMap = new Map(
          product.toppings
            .filter((pt) => pt.topping && pt.topping.isActive)
            .map((pt) => [pt.toppingId, pt.topping]),
        );

        for (const toppingId of requestedToppingIds) {
          const topping = allowedToppingMap.get(toppingId);
          if (!topping) {
            throw new BadRequestException(
              `Topping '${toppingId}' không hợp lệ hoặc đã ngừng bán cho món '${product.name}'`,
            );
          }

          toppingSnapshots.push({
            toppingId: topping.id,
            toppingName: topping.name,
            price: topping.price,
          });
        }
      }

      // 4. Áp dụng công thức tính đơn giá đồng nhất với FE
      // Giá gốc size S lấy từ product.price, phụ thu lấy từ sizeConfig.extraPrice
      const unitPrice = calcUnitPrice(
        product.price,
        { size: item.size, extraPrice: sizeConfig.extraPrice },
        toppingSnapshots.map((t) => ({ price: t.price })),
      );

      // Thành tiền của dòng món = đơn giá * số lượng
      const lineTotal = unitPrice * item.qty;

      pricedItems.push({
        productId: product.id,
        productName: product.name,
        size: item.size,
        basePrice: product.price,
        sizeExtra: sizeConfig.extraPrice,
        unitPrice,
        qty: item.qty,
        lineTotal,
        toppings: toppingSnapshots,
      });
    }

    // 5. Tính tổng cộng đơn hàng
    const subtotal = pricedItems.reduce((acc, item) => acc + item.lineTotal, 0);
    const discountAmount = 0; // Sẵn sàng mở rộng tích hợp voucher Promotion ở Sprint 3
    const total = Math.max(0, subtotal - discountAmount);

    return {
      subtotal,
      discountAmount,
      total,
      items: pricedItems,
    };
  }
}
