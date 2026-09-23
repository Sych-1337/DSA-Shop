# Status

## Current phase

**Soft-launch readiness** — prepaid (FOP + WayForPay), multi-role admin, security lockdown.

## Shipped

- Storefront i18n UA/EN/RU
- Guest cart → prepaid checkout (`BANK_TRANSFER` | `ONLINE`)
- Admin: orders, inventory, catalog, content, SEO, commissions, returns, reviews, **staff**, settings status
- RBAC page + action gates; admin sign-out
- Order access tokens on pay/success
- Mock payment settle/webhook blocked in production
- WayForPay provider + webhook route
- Resend/SMTP email providers (mock default)
- HTTPS force-redirect in production proxy
- Unpaid order cancel via cron (`UNPAID_ORDER_CANCEL_HOURS`)
- Product PUBLISHED validation (category, SKU, price, image)

## Known limitations

- Nova Poshta still mock geography; TTN entered manually in admin
- In-memory rate limiter is single-node
- Catalog content not multi-language in DB
- OAuth (Google/Apple/Telegram) still stubs on storefront account

## Tests

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm test:e2e
```

## Next

1. Fill FOP + WayForPay + Resend env on Render  
2. Certificate Issued for `dsa-anime.shop`  
3. Publish real catalog via admin checklist  
