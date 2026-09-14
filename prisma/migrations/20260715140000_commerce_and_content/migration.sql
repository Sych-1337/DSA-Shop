CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE_RECEIPT', 'SALE', 'RESERVATION', 'RESERVATION_RELEASE', 'RETURN', 'WRITE_OFF', 'MANUAL_ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT');


CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'FIRST_ORDER');


CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'NEW', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'PICKING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURN_IN_PROGRESS', 'RETURNED');


CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'COD_PENDING', 'COD_PAID');


CREATE TYPE "FulfillmentStatus" AS ENUM ('NOT_READY', 'READY', 'LABEL_CREATED', 'HANDED_TO_CARRIER', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'REFUSED', 'RETURNING', 'RETURNED');


CREATE TYPE "OrderSource" AS ENUM ('WEBSITE', 'INSTAGRAM', 'TELEGRAM', 'PHONE', 'OFFLINE', 'OTHER');


CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'COD');


CREATE TYPE "ShippingMethod" AS ENUM ('WAREHOUSE', 'LOCKER', 'ADDRESS');


CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');


CREATE TYPE "HomepageBlockType" AS ENUM ('HERO', 'CATEGORY_STRIP', 'BENEFITS', 'PRODUCT_GRID_FEATURED', 'PRODUCT_GRID_NEW', 'PRODUCT_GRID_FOR_YOU', 'CTA_BANNER');


CREATE TYPE "SettlementPeriodStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'LOCKED');


CREATE TYPE "CommissionLineStatus" AS ENUM ('PENDING', 'INCLUDED', 'EXCLUDED', 'PAID');


CREATE TYPE "CommissionRateChangeReason" AS ENUM ('YEAR_ELAPSED', 'PAYOFF_REACHED', 'MANUAL');


CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "orderId" TEXT,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_reservations" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cartId" TEXT,
    "orderId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "anonymousToken" TEXT,
    "userId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'UAH',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cart_coupons" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_coupons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "percentOff" INTEGER,
    "amountOff" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'UAH',
    "minOrderAmount" INTEGER,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "perCustomerLimit" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "source" "OrderSource" NOT NULL DEFAULT 'WEBSITE',
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'NOT_READY',
    "userId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerFirstName" TEXT NOT NULL,
    "customerLastName" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UAH',
    "subtotalAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "shippingAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "couponCode" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'ONLINE',
    "shippingMethod" "ShippingMethod" NOT NULL DEFAULT 'WAREHOUSE',
    "shippingCity" TEXT,
    "shippingWarehouseRef" TEXT,
    "shippingAddressLine" TEXT,
    "customerNote" TEXT,
    "idempotencyKey" TEXT,
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "productTitle" TEXT NOT NULL,
    "variantTitle" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "selectedOptions" JSONB,
    "unitPriceAmount" INTEGER NOT NULL,
    "compareAtPriceAmount" INTEGER,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL,
    "lineTotalAmount" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderAddressSnapshot" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "warehouseRef" TEXT,
    "addressLine" TEXT,
    "method" "ShippingMethod" NOT NULL,

    CONSTRAINT "OrderAddressSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "reason" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_notes" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalPaymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UAH',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "redirectUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalShipmentId" TEXT,
    "trackingNumber" TEXT,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'NOT_READY',
    "method" "ShippingMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "homepage_blocks" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "HomepageBlockType" NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_blocks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "authorName" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seo_meta" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "h1" TEXT,
    "canonicalPath" TEXT,
    "ogImageUrl" TEXT,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_meta_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "redirects" (
    "id" TEXT NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redirects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "properties" JSONB,
    "path" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commission_agreements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "yearOneRateBps" INTEGER NOT NULL DEFAULT 700,
    "ongoingRateBps" INTEGER NOT NULL DEFAULT 400,
    "payoffTargetAmount" INTEGER NOT NULL,
    "eligibleSources" JSONB NOT NULL DEFAULT '["WEBSITE"]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_agreements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commission_rate_periods" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "rateBps" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "reason" "CommissionRateChangeReason" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_rate_periods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commission_settlement_periods" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "SettlementPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'UAH',
    "totalEligibleBase" INTEGER NOT NULL DEFAULT 0,
    "totalCommission" INTEGER NOT NULL DEFAULT 0,
    "totalAdjustments" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_settlement_periods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commission_line_items" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "source" "OrderSource" NOT NULL,
    "eligibleSubtotal" INTEGER NOT NULL,
    "shippingExcluded" INTEGER NOT NULL DEFAULT 0,
    "returnsAmount" INTEGER NOT NULL DEFAULT 0,
    "adjustmentAmount" INTEGER NOT NULL DEFAULT 0,
    "baseAmount" INTEGER NOT NULL,
    "rateBps" INTEGER NOT NULL,
    "commissionAmount" INTEGER NOT NULL,
    "inclusionReason" TEXT NOT NULL,
    "status" "CommissionLineStatus" NOT NULL DEFAULT 'INCLUDED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_line_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commission_adjustments" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commission_payments" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "method" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stock_movements_inventoryItemId_idx" ON "stock_movements"("inventoryItemId");

CREATE INDEX "stock_movements_orderId_idx" ON "stock_movements"("orderId");

CREATE INDEX "inventory_reservations_inventoryItemId_idx" ON "inventory_reservations"("inventoryItemId");

CREATE INDEX "inventory_reservations_orderId_idx" ON "inventory_reservations"("orderId");

CREATE INDEX "inventory_reservations_expiresAt_idx" ON "inventory_reservations"("expiresAt");

CREATE UNIQUE INDEX "carts_anonymousToken_key" ON "carts"("anonymousToken");

CREATE INDEX "carts_userId_idx" ON "carts"("userId");

CREATE INDEX "cart_items_variantId_idx" ON "cart_items"("variantId");

CREATE UNIQUE INDEX "cart_items_cartId_variantId_key" ON "cart_items"("cartId", "variantId");

CREATE UNIQUE INDEX "cart_coupons_cartId_couponId_key" ON "cart_coupons"("cartId", "couponId");

CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

CREATE UNIQUE INDEX "orders_idempotencyKey_key" ON "orders"("idempotencyKey");

CREATE INDEX "orders_status_idx" ON "orders"("status");

CREATE INDEX "orders_paymentStatus_idx" ON "orders"("paymentStatus");

CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

CREATE INDEX "orders_customerEmail_idx" ON "orders"("customerEmail");

CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

CREATE UNIQUE INDEX "OrderAddressSnapshot_orderId_key" ON "OrderAddressSnapshot"("orderId");

CREATE INDEX "order_status_history_orderId_idx" ON "order_status_history"("orderId");

CREATE INDEX "order_notes_orderId_idx" ON "order_notes"("orderId");

CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

CREATE UNIQUE INDEX "payments_provider_externalPaymentId_key" ON "payments"("provider", "externalPaymentId");

CREATE INDEX "payment_events_paymentId_idx" ON "payment_events"("paymentId");

CREATE INDEX "webhook_events_createdAt_idx" ON "webhook_events"("createdAt");

CREATE UNIQUE INDEX "webhook_events_provider_externalEventId_key" ON "webhook_events"("provider", "externalEventId");

CREATE INDEX "shipments_orderId_idx" ON "shipments"("orderId");

CREATE UNIQUE INDEX "homepage_blocks_key_key" ON "homepage_blocks"("key");

CREATE INDEX "homepage_blocks_isEnabled_sortOrder_idx" ON "homepage_blocks"("isEnabled", "sortOrder");

CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

CREATE INDEX "blog_posts_status_publishedAt_idx" ON "blog_posts"("status", "publishedAt");

CREATE INDEX "seo_meta_entityType_idx" ON "seo_meta"("entityType");

CREATE UNIQUE INDEX "seo_meta_entityType_entityId_key" ON "seo_meta"("entityType", "entityId");

CREATE UNIQUE INDEX "redirects_fromPath_key" ON "redirects"("fromPath");

CREATE INDEX "redirects_isActive_idx" ON "redirects"("isActive");

CREATE INDEX "analytics_events_name_createdAt_idx" ON "analytics_events"("name", "createdAt");

CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");

CREATE INDEX "daily_metrics_key_date_idx" ON "daily_metrics"("key", "date");

CREATE UNIQUE INDEX "daily_metrics_date_key_key" ON "daily_metrics"("date", "key");

CREATE INDEX "commission_rate_periods_agreementId_startsAt_idx" ON "commission_rate_periods"("agreementId", "startsAt");

CREATE INDEX "commission_settlement_periods_status_idx" ON "commission_settlement_periods"("status");

CREATE UNIQUE INDEX "commission_settlement_periods_agreementId_year_month_key" ON "commission_settlement_periods"("agreementId", "year", "month");

CREATE UNIQUE INDEX "commission_line_items_orderId_key" ON "commission_line_items"("orderId");

CREATE INDEX "commission_line_items_periodId_idx" ON "commission_line_items"("periodId");

CREATE INDEX "commission_line_items_orderNumber_idx" ON "commission_line_items"("orderNumber");

CREATE INDEX "commission_adjustments_periodId_idx" ON "commission_adjustments"("periodId");

CREATE INDEX "commission_payments_periodId_idx" ON "commission_payments"("periodId");

ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_coupons" ADD CONSTRAINT "cart_coupons_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_coupons" ADD CONSTRAINT "cart_coupons_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderAddressSnapshot" ADD CONSTRAINT "OrderAddressSnapshot_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commission_rate_periods" ADD CONSTRAINT "commission_rate_periods_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "commission_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commission_settlement_periods" ADD CONSTRAINT "commission_settlement_periods_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "commission_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commission_line_items" ADD CONSTRAINT "commission_line_items_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "commission_settlement_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "commission_settlement_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "commission_settlement_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

