# Implementation Plan

## Phase 0 — Architecture

- [x] Documentation package
- [x] Design direction decisions
- [x] Route / RBAC / commission / order machine specs
- [x] Prisma schema foundation (Phase 1)

## Phase 1 — Foundation

- [x] Next.js 16 + pnpm + Tailwind 4 + ESLint/Prettier/Vitest
- [x] Docker Compose Postgres
- [x] Prisma foundation + migrate + seed (settings, roles, admin)
- [x] Better Auth
- [x] Design tokens + themes + UI button primitive
- [x] Store layout header/footer hybrid
- [x] Mock providers
- [x] Placeholder key routes + admin shell
- [x] Quality gates green

## Phase 2 — Catalog

- [x] Products, variants, categories, fandoms, collections
- [x] Search / filters / sort / pagination
- [x] Product detail page (variants + stock)
- [x] Admin product list + create/edit foundation
- [x] Demo seed + placeholder media
- [x] Quality gates green

## Phase 3 — Cart & checkout

- [x] Carts (anonymous cookie)
- [x] Guest checkout + idempotency
- [x] Inventory reservation + sale on payment
- [x] Mock payment + webhook
- [x] Mock shipping quote / free threshold
- [x] Order snapshots + success page
- [x] Quality gates green

## Phase 4 — Sales admin

- [x] Dashboard metrics + action queues
- [x] Orders table + detail + status transitions
- [x] Sales kanban
- [x] Payments / inventory / shipments lists (DB)
- [x] Create shipment from READY_TO_SHIP / PICKING
- [x] State machine unit tests + quality gates

## Phase 5 — Content, SEO, analytics

- [x] Homepage CMS blocks (+ brand-first hero)
- [x] Blog list/detail from DB + seed
- [x] SeoMeta + redirects admin
- [x] sitemap.xml / robots.txt
- [x] JSON-LD (org, website, breadcrumbs, product, blog)
- [x] Analytics events + admin reports
- [x] Quality gates green

## Phase 6 — Commission & finance

- [x] Agreement + rate periods (7% / 4%, year & payoff switch)
- [x] Settlement periods draft → lock
- [x] Line items from eligible delivered/completed website orders
- [x] Adjustments + payments
- [x] Accrual hook on order status transitions
- [x] Admin commissions dashboard
- [x] Unit tests + quality gates

## Phase 7 — Hardening

- [x] Admin RBAC gate + permission-checked actions
- [x] Security headers + rate limits + cron reservation expiry
- [x] a11y skip link; cart/checkout noindex
- [x] Playwright smoke + GitHub Actions CI
- [x] Dockerfile + deployment docs
- [x] Quality gates

After each phase: lint, typecheck, test, build, update `STATUS.md`.
