ALTER TABLE "Product" ADD COLUMN "description" TEXT;

CREATE TABLE "ProductSize" (
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "extraPrice" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("productId", "size")
);

INSERT INTO "ProductSize" ("productId", "size", "extraPrice")
SELECT product."id", sizes."size", sizes."extraPrice"
FROM "Product" AS product
CROSS JOIN (VALUES ('S', 0), ('M', 5000), ('L', 10000)) AS sizes("size", "extraPrice");

CREATE TABLE "Topping" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topping_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductTopping" (
    "productId" TEXT NOT NULL,
    "toppingId" TEXT NOT NULL,

    CONSTRAINT "ProductTopping_pkey" PRIMARY KEY ("productId", "toppingId")
);

CREATE UNIQUE INDEX "Topping_name_key" ON "Topping"("name");
CREATE INDEX "ProductTopping_toppingId_idx" ON "ProductTopping"("toppingId");

ALTER TABLE "ProductSize"
ADD CONSTRAINT "ProductSize_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductTopping"
ADD CONSTRAINT "ProductTopping_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductTopping"
ADD CONSTRAINT "ProductTopping_toppingId_fkey"
FOREIGN KEY ("toppingId") REFERENCES "Topping"("id") ON DELETE RESTRICT ON UPDATE CASCADE;