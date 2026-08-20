# Decisions

Dated decisions for ambiguous cases. Newest first.

## 2026-07-14 — Storefront locales UA / EN / RU

Storefront and account routes live under `app/[locale]` with prefixes `/uk`, `/en`, `/ru` (`localePrefix: always`). Default `uk`. Admin / API / webhooks stay unprefixed. UI strings via `next-intl` message files in `/messages`. Product/CMS body content remains source-language for now (DB fields not yet multi-locale).

## 2026-07-14 — Admin auth bypass (dev only)

`ADMIN_AUTH_BYPASS=true` grants full OWNER-equivalent staff context without a session when `NODE_ENV !== "production"`. Production always ignores the flag. Real staff login lives at `/admin/login` (Better Auth email/password + `StaffProfile`).

## 2026-07-14 — Store brand: D&A (Dreams & Anime)

Client folder and commercial name fixed as **D&A**. Ampersand is productized as **Dreams & Anime** (D & A): tagline, metadata, and hero expansion under the wordmark. Display string still comes from `StoreSetting` (`store.name` / `store.tagline`); seed defaults are `D&A` and `Dreams & Anime`. Technical IDs (`kawaiko_*` cookies, DB user) may lag without breaking branding.

## 2026-07-14 — Theme provider without next-themes script injection

`next-themes` injects a React `<script>` that React 19 / Next 16 flags as an error. Replaced with a custom ThemeProvider + FOUC script in Server Component `<head>` so prevention stays outside the client component tree.

## 2026-07-14 — Hybrid visual system

Storefront sits between light kawaii (soft pink, dark header/footer, rounded airy cards) and dark manga (high contrast, neon pink, glow, sticker badges). Manga/halftone textures only in hero/promo. Tokens from master prompt; themes `light` | `dark` | `system` via custom ThemeProvider without FOUC.

## 2026-07-14 — Money

All monetary values stored as integers in minor units (UAH kopiyky). No floats. Display formatting only at edges.

## 2026-07-14 — Provider adapters

Domain depends on interfaces only. Default providers are mocks so the app runs without API keys. Real UA payment/shipping adapters later.

## 2026-07-14 — Commission

Implements master prompt: 7% year one, 4% after year or payoff target, eligible website completed product sales excluding shipping/manual sources by default, locked monthly settlements with late adjustments.

## 2026-07-14 — Search MVP

PostgreSQL full-text + trigram. `SearchProvider` interface prepared for Meilisearch swap.

## 2026-07-14 — Inventory vs cart

Add-to-cart does not reduce on-hand. Reservation starts at checkout for online payment (default TTL 15 minutes). Sale stock movement on successful payment confirmation path.

## 2026-07-14 — Monolith first

Single Next.js app with route groups. No microservices at start. Outbox table for async jobs.

## 2026-07-14 — Seed media

Neutral/original demo images and fictional fandom names only. No copyrighted character artwork in seed.
