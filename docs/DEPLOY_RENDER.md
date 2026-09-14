# Deploy on Render (app + Postgres)

Vercel / Supabase path is dropped for this project. Use **Render Web Service + Render PostgreSQL**.

Images stay on disk via `STORAGE_PROVIDER=local` and a **persistent disk** mounted at `public/uploads`.

## Cost (approx.)

| Resource | Plan | Note |
|----------|------|------|
| Web | Starter | Needed for persistent disk (Free web loses uploads on redeploy) |
| PostgreSQL | Basic 256MB | Render no longer offers free Postgres |
| Disk 1 GB | with Starter | Product / blog images |

Free web alone is OK only for a dry-run without lasting uploads.

## 1. One-click Blueprint

1. Push repo to GitHub (already: [DSA-Shop](https://github.com/Sych-1337/DSA-Shop)).
2. Render Dashboard → **New** → **Blueprint** → select the repo.  
   Or **Web Service** with **Native** Node (not Docker). A Dockerfile in the repo can make Render build with Docker and fail migrate/sitemap without DB — prefer Native + `buildCommand` from `render.yaml`.
3. Confirm `render.yaml` (creates `da-shop` web + `da-shop-db` Postgres + uploads disk).
4. Fill prompted env vars:
   - `APP_URL` = `https://da-shop.onrender.com` (or your custom domain later)
   - `BETTER_AUTH_URL` = same as `APP_URL`
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (strong password)
5. Deploy.

`DATABASE_URL` is injected from the linked database automatically.

## 2. Manual setup (without Blueprint)

1. **New → PostgreSQL** → copy Internal Database URL.
2. **New → Web Service** → connect repo:
   - Runtime: Node
   - Build: `corepack enable && pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm exec prisma migrate deploy && pnpm build`
   - Start: `pnpm start`
   - Health: `/api/health`
3. Attach **Disk**: mount path `/opt/render/project/src/public/uploads`, size 1 GB.
4. Env (minimum):

```
NODE_ENV=production
DATABASE_URL=<from Render Postgres>
DATABASE_SSL=true
DATABASE_POOL_MAX=5
STORAGE_PROVIDER=local
APP_URL=https://YOUR-SERVICE.onrender.com
BETTER_AUTH_URL=https://YOUR-SERVICE.onrender.com
BETTER_AUTH_SECRET=<random ≥ 32 chars>
CRON_SECRET=<random>
ADMIN_AUTH_BYPASS=false
PAYMENT_PROVIDER=mock
SHIPPING_PROVIDER=mock
EMAIL_PROVIDER=mock
```

## 3. Seed admin (once)

After first successful deploy, open Render **Shell** on the web service:

```bash
pnpm db:seed
```

Then open `/admin/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` and change the password.

## 4. Custom domain

Render → Web Service → **Settings → Custom Domains** → add your domain → set DNS (CNAME/A) as shown.  
Update `APP_URL` and `BETTER_AUTH_URL` to `https://your-domain.com` and redeploy.

## 5. Cron (reservations)

Render cron / external ping every 10–15 min:

```bash
curl -X POST "$APP_URL/api/cron/expire-reservations" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 6. Local development

Keep using Docker Postgres + `STORAGE_PROVIDER=local` (see `.env.example`). No Supabase keys needed.

## Checklist

- [ ] Blueprint / services created  
- [ ] Migrate ran in build (or Shell: `pnpm db:migrate:deploy`)  
- [ ] Seed ran once  
- [ ] Disk mounted → upload a product image in admin → survives redeploy  
- [ ] `ADMIN_AUTH_BYPASS=false`  
- [ ] Domain + `APP_URL` / `BETTER_AUTH_URL` match HTTPS  
