# Project Spec — D&A Dreams & Anime Shop

## Purpose

Production-ready Ukrainian anime merch storefront with admin operations, inventory, payments, shipping, returns, SEO, analytics, and automatic developer commission settlements.

## Brand

- Seed store name: **D&A**
- Ampersand expansion: **Dreams & Anime** (`store.tagline`)
- Actual display name comes from `StoreSetting`, never hardcoded past fallbacks in `src/lib/brand.ts`
- UI language: Ukrainian
- Code, models, technical docs: English
- Currency: UAH (amounts in kopiyky / minor units)

## Visual direction

Hybrid of two client references:

- Light: friendly kawaii commercial — soft pink backgrounds, dark chrome header/footer, rounded cards, airy product grids
- Dark: manga/comic energy — graphite surfaces, neon pink accent, glow, sticker badges, halftone only in promo areas

Themes: `light` | `dark` | `system`. Design tokens via CSS variables.

References:

- `docs/reference/store-light-reference.png`
- `docs/reference/store-dark-reference.png`

## Product domains

Storefront, customer account, admin panel, API route handlers, webhooks — single Next.js app.

Core commerce: catalog (products/variants), search/filters, cart, guest checkout, payments, shipping, inventory reservations, orders, returns, promotions, reviews, CMS homepage blocks, SEO, staff RBAC, audit log, developer commissions (7% → 4%).

## Non-goals (MVP)

- Microservices
- Real payment/shipping provider hard-wiring (interfaces + mocks first)
- Full accounting ERP
- Multi-language UI at launch (prepared for later)
- Copyrighted character assets in seed data

## Success criteria

See Definition of Done in the master prompt and `docs/IMPLEMENTATION_PLAN.md`. At minimum: guest can buy with mock payment, admin can fulfill through completion, stock moves via movements only, commission settlements lock correctly, lint/typecheck/test/build pass.
