-- AlterEnum
ALTER TYPE "HomepageBlockType" ADD VALUE IF NOT EXISTS 'PRODUCT_GRID_FOR_YOU';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "InterestSignal" AS ENUM ('VIEW', 'CART', 'WISHLIST', 'PURCHASE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_interests" (
    "id" TEXT NOT NULL,
    "shopperKey" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "signal" "InterestSignal" NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_interests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_interests_shopperKey_productId_signal_key"
  ON "product_interests"("shopperKey", "productId", "signal");
CREATE INDEX IF NOT EXISTS "product_interests_shopperKey_updatedAt_idx"
  ON "product_interests"("shopperKey", "updatedAt");
CREATE INDEX IF NOT EXISTS "product_interests_productId_idx"
  ON "product_interests"("productId");

DO $$ BEGIN
  ALTER TABLE "product_interests" ADD CONSTRAINT "product_interests_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
