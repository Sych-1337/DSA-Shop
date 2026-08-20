# Status

## Current phase

**Localization + Phase 7 hardening** (i18n shipped)

### i18n (UA / EN / RU)
- Storefront under `/uk`, `/en`, `/ru` (`next-intl`)
- Language switcher in header / mobile nav
- Message catalogs in `messages/{uk,en,ru}.json` (~200 UI keys, parity across locales)
- Full UI chrome localized: nav, home, catalog/filters/search, PDP, cart, checkout, blog crumbs, account placeholders, errors
- Sitemap entries per locale; admin stays unprefixed (UA ops UI)
- Product titles/descriptions, category/fandom names, blog body still single-language in DB

## Completed

### Phase 0–6
- Docs through commission engine (see prior entries)

### Phase 7
- Admin RBAC: staff session gate, permission checks on server actions, nav filter, `/admin/login` + `/admin/forbidden`
- `ADMIN_AUTH_BYPASS=true` only outside production (local convenience)
- Security headers in `next.config.ts` (CSP, frame deny, nosniff, referrer, permissions)
- Rate limits: checkout + mock webhook + cron
- Reservation expiry cron: `POST /api/cron/expire-reservations`
- noindex for cart/checkout; skip-to-content link
- Playwright smoke E2E + GitHub Actions CI
- `Dockerfile` + `docs/DEPLOYMENT.md`

## Tests

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm test:e2e   # needs Chromium: pnpm exec playwright install chromium
```

## Known limitations

- Coupon UI on checkout still missing
- Cart merge on login not implemented
- Returns UI incomplete
- In-memory rate limiter is single-node only
- Formal `prisma migrate` still preferred after user consent

## Next actions

1. Production deploy dry-run (HTTPS + cron)
2. Coupon field on checkout
3. Optional 2FA for staff
