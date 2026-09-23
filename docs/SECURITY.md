# Security (as implemented)

## Auth

- Better Auth email/password; admin requires active `StaffProfile`
- `ADMIN_AUTH_BYPASS` ignored when `NODE_ENV=production`
- Admin `?next=` sanitized to `/admin…` paths only (`safeAdminNext`)
- `trustedOrigins` includes `APP_URL`, `BETTER_AUTH_URL`, `RENDER_EXTERNAL_URL`, `AUTH_TRUSTED_ORIGINS`

## Payments

- Soft launch: **prepaid only** (`ONLINE` / `BANK_TRANSFER`). COD not offered in checkout.
- Mock settle + mock webhook allowed only when `PAYMENT_PROVIDER=mock` **and** `NODE_ENV !== production`
- Mock webhook requires `PAYMENT_WEBHOOK_SECRET`
- WayForPay webhook verifies merchant signature
- Order pay/success pages require HMAC access token (order + email)
- Manual mark-paid requires `payments.manualMark` + audit log

## Admin RBAC

- Layout `requireStaff`; pages call `requirePermission` matching nav
- Mutations use `assertPermission`
- Staff lifecycle: `/admin/staff` (`staff.manage`)

## Rate limits

- In-memory fixed window (single instance): checkout, webhooks, cron
- Contact / track-order should stay rate-limited at action layer

## Headers

- CSP / frame / nosniff via `next.config.ts`

## Ops

- Force HTTPS redirect in `src/proxy.ts` when `x-forwarded-proto=http` in production
- Cron cancels unpaid prepaid orders after `UNPAID_ORDER_CANCEL_HOURS` (default 48)
