-- Idempotent: first failed run on Render left these enums behind (orders missing).
DO $$ BEGIN
    CREATE TYPE "ReturnRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'RECEIVED', 'REJECTED', 'REFUNDED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReturnReason" AS ENUM ('NOT_SUITABLE', 'WRONG_ITEM', 'DEFECT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReturnItemResolution" AS ENUM ('PENDING', 'RESTOCK', 'WRITE_OFF');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "return_requests" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "ReturnRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" "ReturnReason" NOT NULL,
    "customerNote" TEXT,
    "adminNote" TEXT,
    "refundAmount" INTEGER,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "return_items" (
    "id" TEXT NOT NULL,
    "returnRequestId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "resolution" "ReturnItemResolution" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "return_requests_orderId_idx" ON "return_requests"("orderId");
CREATE INDEX IF NOT EXISTS "return_requests_status_idx" ON "return_requests"("status");
CREATE INDEX IF NOT EXISTS "return_requests_createdAt_idx" ON "return_requests"("createdAt");
CREATE INDEX IF NOT EXISTS "return_items_returnRequestId_idx" ON "return_items"("returnRequestId");
CREATE INDEX IF NOT EXISTS "return_items_orderItemId_idx" ON "return_items"("orderItemId");

DO $$ BEGIN
    ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "return_items" ADD CONSTRAINT "return_items_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "return_items" ADD CONSTRAINT "return_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
