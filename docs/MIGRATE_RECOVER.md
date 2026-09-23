# Recover failed Prisma migrate on Render

## What went wrong

A failed `return_requests` run left **tables without enum columns**.  
`DROP TYPE … CASCADE` removed the types/columns but **kept empty tables**, so the next `CREATE TABLE` failed with `relation already exists`.

## Fix (already done if DB was repaired remotely)

If it happens again from Shell:

```bash
./node_modules/.bin/prisma db execute --stdin <<'SQL'
DROP TABLE IF EXISTS "return_items" CASCADE;
DROP TABLE IF EXISTS "return_requests" CASCADE;
DROP TYPE IF EXISTS "ReturnItemResolution" CASCADE;
DROP TYPE IF EXISTS "ReturnReason" CASCADE;
DROP TYPE IF EXISTS "ReturnRequestStatus" CASCADE;
DELETE FROM "_prisma_migrations" WHERE migration_name = '20260715153000_return_requests';
SQL

./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/tsx prisma/seed.ts
```

Use the **Internal** `DATABASE_URL` on the Render web service. External URL is only for local `psql` / laptop.

## Env checklist (web service)

| Key | Notes |
|-----|--------|
| `DATABASE_URL` | Internal URL: `…@dpg-…-a/dashopdb` (no `.ohio-postgres…`) |
| `DATABASE_SSL` | `true` |
| `APP_URL` / `BETTER_AUTH_URL` | `https://dsa-anime.shop` (or `https://dsa-shop.onrender.com` until DNS works) |
| `BETTER_AUTH_SECRET` | ≥32 chars |
| `STORAGE_PROVIDER` | `local` (if using disk) |
| `ADMIN_AUTH_BYPASS` | `false` in production |
