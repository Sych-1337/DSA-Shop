-- AlterTable
ALTER TABLE "customer_profiles" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "customer_profiles" ADD COLUMN "anonymousToken" TEXT;
ALTER TABLE "customer_profiles" ADD COLUMN "firstName" TEXT;
ALTER TABLE "customer_profiles" ADD COLUMN "lastName" TEXT;
ALTER TABLE "customer_profiles" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "customer_profiles" ADD COLUMN "city" TEXT;
ALTER TABLE "customer_profiles" ADD COLUMN "telegramUsername" TEXT;
ALTER TABLE "customer_profiles" ADD COLUMN "birthDate" DATE;
ALTER TABLE "customer_profiles" ADD COLUMN "note" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_anonymousToken_key" ON "customer_profiles"("anonymousToken");

-- CreateTable
CREATE TABLE "wishlist_lists" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousToken" TEXT,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wishlist_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wishlist_lists_userId_idx" ON "wishlist_lists"("userId");

-- CreateIndex
CREATE INDEX "wishlist_lists_anonymousToken_idx" ON "wishlist_lists"("anonymousToken");

-- CreateIndex
CREATE INDEX "wishlist_items_productId_idx" ON "wishlist_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_listId_productId_key" ON "wishlist_items"("listId", "productId");

-- AddForeignKey
ALTER TABLE "wishlist_lists" ADD CONSTRAINT "wishlist_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_listId_fkey" FOREIGN KEY ("listId") REFERENCES "wishlist_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
