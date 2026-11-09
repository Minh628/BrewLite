import { PaymentMethod, Prisma, Size } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Kiểm thử toàn diện các ràng buộc (Constraints) của Prisma Schema (DMMF) và SQL Migration:
 * 1. Ràng buộc kiểu dữ liệu Enum (Size, PaymentMethod) trên ProductSize, OrderItem, Payment.
 * 2. Ràng buộc toàn vẹn tham chiếu khóa ngoại (onDelete: Cascade vs Restrict).
 * 3. Ràng buộc hiệu năng truy vấn (Indexes) và miền giá trị (PostgreSQL CHECK Constraints).
 */
describe('Prisma Schema & Migration Constraints Verification', () => {
  const models = Prisma.dmmf.datamodel.models;
  const getModel = (name: string) => {
    const found = models.find((m) => m.name === name);
    if (!found) throw new Error(`Không tìm thấy model ${name} trong Prisma DMMF`);
    return found;
  };

  describe('1. Ràng buộc kiểu dữ liệu Enum (Size & PaymentMethod)', () => {
    it('Enum Size chỉ chứa đúng 3 giá trị S, M, L', () => {
      expect(Object.values(Size)).toEqual(['S', 'M', 'L']);
    });

    it('Enum PaymentMethod chỉ chứa đúng 2 giá trị WALLET, CARD', () => {
      expect(Object.values(PaymentMethod)).toEqual(['WALLET', 'CARD']);
    });

    it('ProductSize.size và OrderItem.size bắt buộc sử dụng enum Size thay vì String', () => {
      const productSizeField = getModel('ProductSize').fields.find((f) => f.name === 'size');
      const orderItemSizeField = getModel('OrderItem').fields.find((f) => f.name === 'size');

      expect(productSizeField?.kind).toBe('enum');
      expect(productSizeField?.type).toBe('Size');
      expect(orderItemSizeField?.kind).toBe('enum');
      expect(orderItemSizeField?.type).toBe('Size');
    });

    it('Payment.method bắt buộc sử dụng enum PaymentMethod thay vì String', () => {
      const paymentMethodField = getModel('Payment').fields.find((f) => f.name === 'method');

      expect(paymentMethodField?.kind).toBe('enum');
      expect(paymentMethodField?.type).toBe('PaymentMethod');
    });
  });

  describe('2. Ràng buộc toàn vẹn khóa ngoại (Referential Integrity / onDelete)', () => {
    it('Các thực thể phụ thuộc chặt (Weak Entities) phải bật onDelete: Cascade', () => {
      const productSizeRel = getModel('ProductSize').fields.find((f) => f.name === 'product');
      const ptProductRel = getModel('ProductTopping').fields.find((f) => f.name === 'product');
      const ptToppingRel = getModel('ProductTopping').fields.find((f) => f.name === 'topping');
      const orderItemOrderRel = getModel('OrderItem').fields.find((f) => f.name === 'order');
      const oitOrderItemRel = getModel('OrderItemTopping').fields.find(
        (f) => f.name === 'orderItem',
      );

      expect(productSizeRel?.relationOnDelete).toBe('Cascade');
      expect(ptProductRel?.relationOnDelete).toBe('Cascade');
      expect(ptToppingRel?.relationOnDelete).toBe('Cascade');
      expect(orderItemOrderRel?.relationOnDelete).toBe('Cascade');
      expect(oitOrderItemRel?.relationOnDelete).toBe('Cascade');
    });

    it('Lịch sử giao dịch tài chính (Payment -> Order) và lịch sử món (OrderItem -> Product) không được Cascade', () => {
      const paymentOrderRel = getModel('Payment').fields.find((f) => f.name === 'order');
      const orderItemProductRel = getModel('OrderItem').fields.find((f) => f.name === 'product');

      // Không được đặt Cascade để bảo toàn chứng từ thanh toán và lịch sử đơn hàng
      expect(paymentOrderRel?.relationOnDelete).not.toBe('Cascade');
      expect(orderItemProductRel?.relationOnDelete).not.toBe('Cascade');
    });
  });

  describe('3. Ràng buộc chỉ mục & PostgreSQL CHECK Constraints trong Migration SQL', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../../prisma/migrations/20261109120000_add_schema_constraints/migration.sql',
    );
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    it('Chứa các chỉ mục (Indexes) tối ưu cho hàng đợi pha chế FIFO và JOIN khóa ngoại', () => {
      expect(sql).toContain('CREATE INDEX "Order_status_createdAt_idx"');
      expect(sql).toContain('CREATE INDEX "Promotion_isActive_startsAt_endsAt_idx"');
      expect(sql).toContain('CREATE INDEX "OrderItem_orderId_idx"');
      expect(sql).toContain('CREATE INDEX "OrderItem_productId_idx"');
      expect(sql).toContain('CREATE INDEX "Payment_orderId_idx"');
    });

    it('Chứa đầy đủ 9 PostgreSQL CHECK constraints chống số âm và sai lệch thời gian', () => {
      expect(sql).toContain('ADD CONSTRAINT "Product_non_negative_chk"');
      expect(sql).toContain('ADD CONSTRAINT "ProductSize_extraPrice_non_negative_chk"');
      expect(sql).toContain('ADD CONSTRAINT "Topping_price_non_negative_chk"');
      expect(sql).toContain('ADD CONSTRAINT "User_loyaltyPoints_non_negative_chk"');
      expect(sql).toContain('ADD CONSTRAINT "Order_amounts_non_negative_chk"');
      expect(sql).toContain('ADD CONSTRAINT "OrderItem_qty_and_prices_chk"');
      expect(sql).toContain('ADD CONSTRAINT "OrderItemTopping_price_non_negative_chk"');
      expect(sql).toContain('ADD CONSTRAINT "Payment_amount_non_negative_chk"');
      expect(sql).toContain('ADD CONSTRAINT "Promotion_values_and_dates_chk"');
    });
  });
});
