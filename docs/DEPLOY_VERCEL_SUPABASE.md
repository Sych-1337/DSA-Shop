# Vercel + Supabase (near-zero cost)

Use this to put D&A Shop online today: **Postgres + image storage on Supabase**, **app on Vercel**, your own domain.

## 1. Supabase — database

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string**
   - **App / Vercel `DATABASE_URL`**: Transaction pooler, port **6543**, add `?pgbouncer=true` (and `sslmode=require` if not present).
   - **Laptop migrations `DIRECT_URL`**: Direct or Session connection (port **5432**), not the transaction pooler.
3. From your machine (with `.env` pointing at Supabase):

```bash
pnpm install
# Prefer DIRECT_URL for migrate/seed if DATABASE_URL is the pooler:
DATABASE_URL="$DIRECT_URL" pnpm db:migrate:deploy
DATABASE_URL="$DIRECT_URL" pnpm db:seed
```

Seed creates admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — set strong values first.

## 2. Supabase — images (Storage)

1. **Storage → New bucket**
   - Name: `media` (or same as `SUPABASE_STORAGE_BUCKET`)
   - **Public bucket**: ON
2. **Project Settings → API**
   - `SUPABASE_URL` = Project URL  
   - `SUPABASE_SERVICE_ROLE_KEY` = `service_role` secret (**server only**, never in client)

If the bucket is missing, the app will try to create a public `media` bucket on first upload (needs service role).

In Vercel set:

```
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=media
```

Uploads from **Admin → Products → image picker** go to Supabase and stay there across deploys.

## 3. Vercel — app

1. Import [Sych-1337/DSA-Shop](https://github.com/Sych-1337/DSA-Shop) into Vercel.
2. Framework: Next.js (auto). Build: `pnpm build` (or default).  
   `postinstall` already runs `prisma generate`.
3. Environment variables (Production):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Supabase **pooler** URI (6543) |
| `BETTER_AUTH_SECRET` | random ≥ 32 chars |
| `BETTER_AUTH_URL` | `https://your-domain.com` |
| `APP_URL` | `https://your-domain.com` |
| `STORAGE_PROVIDER` | `supabase` |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `SUPABASE_STORAGE_BUCKET` | `media` |
| `CRON_SECRET` | random string |
| `ADMIN_AUTH_BYPASS` | `false` or omit |
| `SEED_ADMIN_*` | only needed if you re-seed; not required at runtime |

4. Deploy → open `/admin/login` with seeded admin.
5. **Domains** → add your domain → DNS as Vercel shows (usually A/CNAME).

## 4. Cron (reservations)

`vercel.json` runs `/api/cron/expire-reservations` once daily (Hobby limit).  
Vercel sends `Authorization: Bearer $CRON_SECRET` — same secret must be in env.

For more frequent runs free: [cron-job.org](https://cron-job.org) → POST/GET with Bearer header every 10–15 min.

## 5. What stays stub (OK for filling catalog)

- Payment, Nova Poshta, SMTP emails — mock  
- Google / Apple / Telegram login — stub buttons  

You can fill products, categories, blog, images via admin.

## Checklist before go-live today

- [ ] Supabase project created, migrate + seed applied  
- [ ] Public Storage bucket `media`  
- [ ] Vercel env set (`STORAGE_PROVIDER=supabase`, pooler DB URL, auth secrets)  
- [ ] `ADMIN_AUTH_BYPASS` off  
- [ ] Domain attached  
- [ ] Upload one test image in admin → URL starts with `https://….supabase.co/storage/…`  
- [ ] Change admin password after first login  

## Cost

Vercel Hobby + Supabase Free ≈ **$0** (plus your domain). Free Supabase may pause after idle; first request after pause is slow.
