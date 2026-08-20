# Architecture

## Application shape

One Next.js 16 App Router monolith:

```text
src/app/(store)/     # public storefront
src/app/(account)/   # customer account
src/app/admin/       # staff admin
src/app/api/         # REST/route handlers
src/app/webhooks/    # payment/shipping webhooks
```

## Layers

1. **UI** — Server Components by default; client only for interactivity (cart drawer, theme toggle, forms).
2. **Features** — domain-oriented modules under `src/features/*`.
3. **Services** — `src/server/services` — business rules, transactions, state machines.
4. **Repositories** — `src/server/repositories` — Prisma access, no business policy.
5. **Providers** — `src/lib/providers` — Payment, Shipping, Email, SMS, Storage, Analytics with mock + real adapters.
6. **Shared libs** — money, validation, permissions, audit, events.

## Data flow

```text
UI / Route Handler → Service (Zod in) → Repository / Provider → PostgreSQL / external API
                                ↓
                           AuditLog / OutboxEvent
```

- Never trust client prices, stock, or discounts.
- Money: integers in minor units.
- Mutations that change money/stock/orders run in DB transactions.
- Webhooks: verify signature, store event id, process idempotently.

## Auth

Better Auth + Prisma adapter.

- Customers: storefront account + guest checkout
- Staff: admin roles via RBAC (`Role` / `Permission`)
- Sessions: secure cookies; staff permissions checked server-side

## Async work

MVP: database outbox + scheduled processor (`CRON_SECRET`). Replaceable with a queue later.

## Caching / rendering

- SEO catalog/product pages: SSR / static with revalidation
- Account/admin: dynamic, no CDN cache of private data
- Cart: cookie/session keyed anonymous + user merge on login

## Environments

Local: Docker Compose (Postgres). App via `pnpm dev`. Providers default to mock.
Production: VPS-friendly Dockerfile; not locked to Vercel.
