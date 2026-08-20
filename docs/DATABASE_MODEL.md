# Database Model

Money fields: `*Amount` integers in minor units + `currency` (default `UAH`). Soft-delete via `archivedAt` / `deletedAt` where noted. Prefer relations over large JSON; JSON only for provider payloads, block configs, metadata.

## Auth

- `User`, `Session`, `Account`, `Verification` (Better Auth)
- `StaffProfile`, `CustomerProfile`
- `Role`, `Permission`, `UserRole`, `RolePermission`

## Customers

- `CustomerAddress`, `CustomerTag`, `CustomerNote`, `CustomerConsent`

## Catalog

- `Product`, `ProductVariant`, `ProductImage`
- `Category`, `ProductCategory`
- `Brand`, `Fandom`, `Character`
- `Collection`, `CollectionProduct` (manual + rule-based config JSON)
- `OptionDefinition`, `OptionValue`, `VariantOptionValue`
- `ProductAttribute`, `ProductAttributeValue`, `SizeGuide`
- `SeoMeta` (polymorphic entityType + entityId) or per-entity SEO columns

### Product highlights

- `slug`, `title`, `status`, `productType`, `authenticityType`
- Preorder settings columns or nested type
- Variants: own SKU, barcode, price/compare/cost, weight, dims, stock policy

## Inventory

- `Warehouse`
- `InventoryItem` — onHand, reserved, available (computed or maintained), incoming, damaged, returnedInspection, reorderPoint, version
- `InventoryReservation` — cart/order, expiresAt
- `StockMovement` — type enum, delta, reason, actor
- `InventoryCount`, `InventoryCountLine`

No direct stock mutation without a movement row.

## Cart

- `Cart` — anonymousToken / userId, expiresAt
- `CartItem` — variantId, quantity
- `CartCoupon`

## Orders

- `Order` — number, statuses (order / payment / fulfillment kept separate), source, totals
- `OrderItem` — immutable snapshot fields
- `OrderAddressSnapshot`
- `OrderStatusHistory`
- `OrderNote`, `OrderSourceAttribution`

### Order status

`DRAFT`, `NEW`, `AWAITING_CONFIRMATION`, `CONFIRMED`, `PICKING`, `READY_TO_SHIP`, `SHIPPED`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `RETURN_IN_PROGRESS`, `RETURNED`

### Payment status

`PENDING`, `AUTHORIZED`, `PAID`, `FAILED`, `CANCELLED`, `PARTIALLY_REFUNDED`, `REFUNDED`, `COD_PENDING`, `COD_PAID`

### Fulfillment status

`NOT_READY`, `READY`, `LABEL_CREATED`, `HANDED_TO_CARRIER`, `IN_TRANSIT`, `ARRIVED`, `DELIVERED`, `REFUSED`, `RETURNING`, `RETURNED`

## Payments / Shipping / Returns

- `Payment`, `PaymentEvent`, `Refund`, `WebhookEvent`
- `Shipment`, `ShipmentItem`, `ShipmentEvent`
- `ReturnRequest`, `ReturnItem`, `ExchangeOrderLink`

## Promotions

- `Coupon`, `Promotion`, `PromotionRule`, `PromotionAction`, `PromotionUsage`

## Engagement

- `Wishlist`, `WishlistItem`, `RecentlyViewed`
- `Review`, `ReviewImage`, `ProductQuestion`, `BackInStockSubscription`

## Content

- `Page`, `ContentBlock`, `NavigationMenu`, `NavigationItem`
- `BlogPost`, `MediaAsset`, `Redirect`, `StoreSetting`

## Procurement (schema early, UI later)

- `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`, `PurchaseReceipt`

## Ops / Analytics / Commission

- `SearchQueryLog`, `DailyMetric`
- `Notification`, `NotificationTemplate`, `OutboxEvent`, `AuditLog`
- `CommissionAgreement`, `CommissionRatePeriod`, `CommissionSettlementPeriod`
- `CommissionLineItem`, `CommissionAdjustment`, `CommissionPayment`

## Indexes (minimum)

- Unique slugs (product, category, fandom, collection, blog)
- ProductVariant.sku unique
- Order.orderNumber unique
- WebhookEvent.(provider, externalEventId) unique
- InventoryItem.(warehouseId, variantId) unique
- Cart.anonymousToken unique where not null
- Full-text / trigram indexes for search (Phase 2)
