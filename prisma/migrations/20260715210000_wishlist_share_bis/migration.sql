-- AlterTable
ALTER TABLE "wishlist_lists" ADD COLUMN IF NOT EXISTS "shareToken" TEXT;
ALTER TABLE "wishlist_lists" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "wishlist_lists_shareToken_key" ON "wishlist_lists"("shareToken");

-- CreateTable
CREATE TABLE IF NOT EXISTS "back_in_stock_subscriptions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'uk',
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "back_in_stock_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "back_in_stock_subscriptions_email_variantId_key"
  ON "back_in_stock_subscriptions"("email", "variantId");
CREATE INDEX IF NOT EXISTS "back_in_stock_subscriptions_variantId_notifiedAt_idx"
  ON "back_in_stock_subscriptions"("variantId", "notifiedAt");
CREATE INDEX IF NOT EXISTS "back_in_stock_subscriptions_productId_idx"
  ON "back_in_stock_subscriptions"("productId");

DO $$ BEGIN
  ALTER TABLE "back_in_stock_subscriptions" ADD CONSTRAINT "back_in_stock_subscriptions_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "back_in_stock_subscriptions" ADD CONSTRAINT "back_in_stock_subscriptions_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
