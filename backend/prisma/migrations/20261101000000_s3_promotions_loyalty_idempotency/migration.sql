-- Sprint 3 (M4): bảng Promotion + cột khuyến mãi/điểm thưởng/idempotency trên Order
-- Chạy sau 20261023083653_init_user_and_orders.

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- AlterTable: Order — subtotal/discount/promoCode/pointsEarned/idempotencyKey/updatedAt
ALTER TABLE "Order"
    ADD COLUMN "subtotal" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "discount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "promoCode" TEXT,
    ADD COLUMN "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "idempotencyKey" TEXT,
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Đơn cũ: subtotal bằng total hiện có để không vỡ báo cáo
UPDATE "Order" SET "subtotal" = "total" WHERE "subtotal" = 0;

-- CreateTable
CREATE TABLE "Promotion" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "minOrder" INTEGER NOT NULL DEFAULT 0,
    "maxDiscount" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- CreateIndex: chống tạo trùng đơn theo (userId, idempotencyKey)
CREATE UNIQUE INDEX "Order_userId_idempotencyKey_key" ON "Order"("userId", "idempotencyKey");

-- Đồng bộ với schema.prisma (Prisma 6 luôn set default 0 cho total, @updatedAt không có DEFAULT)
ALTER TABLE "Order"
    ALTER COLUMN "total" SET DEFAULT 0,
    ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Promotion.updatedAt dùng @updatedAt của Prisma nên cũng không có DEFAULT ở DB
ALTER TABLE "Promotion" ALTER COLUMN "updatedAt" DROP DEFAULT;
