-- 1. Chuyển đổi kiểu dữ liệu cột sang Native Enum (Size & PaymentMethod) không làm mất dữ liệu hiện có
ALTER TABLE "ProductSize"
  ALTER COLUMN "size" TYPE "Size" USING ("size"::"Size");

ALTER TABLE "Payment"
  ALTER COLUMN "method" TYPE "PaymentMethod" USING ("method"::"PaymentMethod");

-- 2. Cập nhật hành vi khóa ngoại (ON DELETE CASCADE cho các thực thể phụ thuộc chặt)
ALTER TABLE "ProductSize" DROP CONSTRAINT "ProductSize_productId_fkey";
ALTER TABLE "ProductSize"
  ADD CONSTRAINT "ProductSize_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductTopping" DROP CONSTRAINT "ProductTopping_productId_fkey";
ALTER TABLE "ProductTopping"
  ADD CONSTRAINT "ProductTopping_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductTopping" DROP CONSTRAINT "ProductTopping_toppingId_fkey";
ALTER TABLE "ProductTopping"
  ADD CONSTRAINT "ProductTopping_toppingId_fkey"
  FOREIGN KEY ("toppingId") REFERENCES "Topping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Bổ sung các chỉ mục (Indexes) phục vụ truy vấn hàng đợi pha chế và JOIN khóa ngoại
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Promotion_isActive_startsAt_endsAt_idx" ON "Promotion"("isActive", "startsAt", "endsAt");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- 4. Bổ sung ràng buộc miền giá trị tầng CSDL (PostgreSQL CHECK Constraints)
-- Bảo vệ chống âm tiền, âm kho, số lượng <= 0 và khoảng thời gian khuyến mãi đảo ngược
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_non_negative_chk"
  CHECK ("price" >= 0 AND "stock" >= 0 AND "version" >= 0);

ALTER TABLE "ProductSize"
  ADD CONSTRAINT "ProductSize_extraPrice_non_negative_chk"
  CHECK ("extraPrice" >= 0);

ALTER TABLE "Topping"
  ADD CONSTRAINT "Topping_price_non_negative_chk"
  CHECK ("price" >= 0);

ALTER TABLE "User"
  ADD CONSTRAINT "User_loyaltyPoints_non_negative_chk"
  CHECK ("loyaltyPoints" >= 0);

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_amounts_non_negative_chk"
  CHECK ("total" >= 0 AND "subtotal" >= 0 AND "discount" >= 0 AND "pointsEarned" >= 0);

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_qty_and_prices_chk"
  CHECK ("qty" > 0 AND "unitPrice" >= 0 AND "lineTotal" >= 0);

ALTER TABLE "OrderItemTopping"
  ADD CONSTRAINT "OrderItemTopping_price_non_negative_chk"
  CHECK ("price" >= 0);

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_non_negative_chk"
  CHECK ("amount" >= 0);

ALTER TABLE "Promotion"
  ADD CONSTRAINT "Promotion_values_and_dates_chk"
  CHECK ("value" > 0 AND "minOrder" >= 0 AND "usedCount" >= 0 AND "startsAt" < "endsAt");

