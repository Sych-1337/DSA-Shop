# Routes

## Storefront `(store)`

| Path | Purpose |
|------|---------|
| `/` | Home (CMS blocks) |
| `/catalog` | Catalog |
| `/catalog/[categorySlug]` | Category |
| `/fandom/[slug]` | Fandom |
| `/collection/[slug]` | Collection |
| `/product/[slug]` | Product detail |
| `/search` | Search |
| `/cart` | Cart |
| `/checkout` | Checkout |
| `/checkout/success` | Success |
| `/checkout/payment-failed` | Payment failed |
| `/track-order` | Guest tracking |
| `/wishlist` | Wishlist |
| `/blog` | Blog index |
| `/blog/[slug]` | Blog post |
| `/about` | About |
| `/delivery-payment` | Delivery & payment |
| `/returns` | Returns policy |
| `/contacts` | Contacts |
| `/faq` | FAQ |
| `/privacy` | Privacy |
| `/terms` | Terms |
| `/public-offer` | Public offer |

## Account `(account)`

| Path | Purpose |
|------|---------|
| `/account` | Overview |
| `/account/orders` | Orders |
| `/account/orders/[orderNumber]` | Order detail |
| `/account/addresses` | Addresses |
| `/account/wishlist` | Server wishlist |
| `/account/settings` | Settings |

## Admin `/admin`

| Path | Purpose |
|------|---------|
| `/admin` | Dashboard |
| `/admin/sales` | Sales center |
| `/admin/orders` | Orders table |
| `/admin/orders/[id]` | Order detail |
| `/admin/orders/new` | Manual order |
| `/admin/carts` | Abandoned carts |
| `/admin/customers` | CRM |
| `/admin/products` | Products |
| `/admin/categories` | Categories |
| `/admin/fandoms` | Fandoms |
| `/admin/collections` | Collections |
| `/admin/inventory` | Inventory |
| `/admin/purchases` | Purchase orders |
| `/admin/suppliers` | Suppliers |
| `/admin/payments` | Payments |
| `/admin/shipments` | Shipments |
| `/admin/returns` | Returns |
| `/admin/promotions` | Promotions |
| `/admin/reviews` | Reviews |
| `/admin/questions` | Product questions |
| `/admin/content` | CMS |
| `/admin/seo` | SEO tools |
| `/admin/analytics` | Analytics |
| `/admin/finance` | Finance |
| `/admin/commissions` | Developer commissions |
| `/admin/staff` | Staff & roles |
| `/admin/notifications` | Notifications |
| `/admin/integrations` | Integrations |
| `/admin/settings` | Settings |
| `/admin/audit` | Audit log |

## API / Webhooks

| Path | Purpose |
|------|---------|
| `/api/auth/*` | Better Auth |
| `/api/health` | Health |
| `/api/cron/*` | Scheduled jobs |
| `/webhooks/payments/[provider]` | Payment webhooks |
| `/webhooks/shipping/[provider]` | Shipping webhooks |

Cart, checkout, account, and meaningless filter combos: `noindex`.
