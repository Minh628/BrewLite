CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

ALTER TABLE "Product"
ADD COLUMN "categoryId" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

INSERT INTO "Category" ("id", "name", "updatedAt") VALUES
    ('category-coffee', 'Cà phê', CURRENT_TIMESTAMP),
    ('category-tea', 'Trà', CURRENT_TIMESTAMP),
    ('category-other', 'Khác', CURRENT_TIMESTAMP);

UPDATE "Product"
SET "categoryId" = CASE
    WHEN "name" IN ('Ca phe sua', 'Americano', 'Cappuccino') THEN 'category-coffee'
    WHEN "name" = 'Tra dao' THEN 'category-tea'
    ELSE 'category-other'
END;

ALTER TABLE "Product"
ALTER COLUMN "categoryId" SET NOT NULL;

CREATE INDEX "Product_categoryId_isActive_idx" ON "Product"("categoryId", "isActive");

ALTER TABLE "Product"
ADD CONSTRAINT "Product_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;