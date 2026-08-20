# RBAC

## Seed roles

| Role | Intent |
|------|--------|
| `OWNER` | Full access |
| `DEVELOPER_ADMIN` | Ops + commissions read/manage |
| `SUPER_ADMIN` | Full ops except owner-only settings if reserved |
| `SALES_MANAGER` | Orders, customers, payments (limited refund) |
| `WAREHOUSE_MANAGER` | Inventory, shipments, receiving |
| `CONTENT_MANAGER` | CMS, blog, homepage blocks |
| `SEO_MANAGER` | SEO metadata, redirects, sitemaps |
| `MARKETING_MANAGER` | Promotions, campaigns, analytics read |
| `SUPPORT_MANAGER` | Customers, questions, returns intake |
| `FINANCE_MANAGER` | Finance reports, commissions read |

## Permission keys

- `orders.read` / `orders.write` / `orders.cancel`
- `payments.read` / `payments.refund` / `payments.manualMark`
- `products.read` / `products.write` / `products.cost.read`
- `inventory.read` / `inventory.adjust`
- `customers.read` / `customers.export`
- `content.write`
- `seo.write`
- `analytics.read`
- `finance.read`
- `commissions.read` / `commissions.manage`
- `staff.manage`
- `settings.manage`
- `audit.read`

## Rules

1. UI may hide actions; **server must enforce** permissions.
2. Manual mark payment as paid requires `payments.manualMark` + reason + audit.
3. Cost price / margin: `products.cost.read` / `finance.read`.
4. Commission rate changes: `commissions.manage` + reason + audit.
5. Locked settlement periods cannot be silently recalculated.
6. Developer role can read order-level commission lines without full COGS access.

## Staff security

- Email verification, strong passwords
- Login audit, session revocation
- Optional 2FA prepared (not required for MVP)
- Rate limiting on auth endpoints
