# D&A — Dreams & Anime Shop

Ukrainian anime merch e-commerce (Next.js) with admin ops, inventory, commissions.

Brand mark: **D&A** · spoken line: **Dreams & Anime**.

Production-oriented Ukrainian anime / K-Pop / geek merch shop with admin panel, inventory, payments, shipping, returns, SEO, and developer commission settlements.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS 4 · shadcn/ui · next-themes
- PostgreSQL · Prisma 7 · Better Auth
- Zod · Vitest · Playwright · Docker Compose

## Quick start

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres   # або локальний PostgreSQL на порту 5432
pnpm exec prisma db push
pnpm db:seed
pnpm dev
```

Якщо Docker недоступний: PostgreSQL 16 + той самий `DATABASE_URL` з `.env.example`.

Production: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) · Vercel + Supabase: [docs/DEPLOY_VERCEL_SUPABASE.md](docs/DEPLOY_VERCEL_SUPABASE.md).

App: [http://localhost:3000](http://localhost:3000) · Admin: [http://localhost:3000/admin](http://localhost:3000/admin) (`/admin/login` without bypass).

Seed admin: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. Local open admin: `ADMIN_AUTH_BYPASS=true` (never in production).

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build/run |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript |
| `pnpm test` | Unit/integration |
| `pnpm test:e2e` | Playwright |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Prisma Studio |
| `pnpm format` | Prettier |

## Design references

Place or review client mockups at:

- `docs/reference/store-light-reference.png`
- `docs/reference/store-dark-reference.png`

Storefront design is a hybrid of light kawaii commercial and dark manga energy. Themes: light / dark / system.

## Documentation

See `docs/` — start with `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `STATUS.md`.

## License

Private — all rights reserved.
