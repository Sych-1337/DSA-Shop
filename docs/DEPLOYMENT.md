# Deployment

## Render (recommended)

App + PostgreSQL + persistent disk for images on [Render](https://render.com).

Step-by-step: **[DEPLOY_RENDER.md](./DEPLOY_RENDER.md)** · Blueprint: [`render.yaml`](../render.yaml).

## Local / VPS

1. Clone repo, copy `.env.example` → `.env`, set strong secrets.
2. Start Postgres: `docker compose up -d postgres`
3. `pnpm install && pnpm db:migrate:deploy && pnpm db:seed`
4. `pnpm build && pnpm start` (or `pnpm dev`)

### Critical production env

- `ADMIN_AUTH_BYPASS` unset or `false`
- `BETTER_AUTH_SECRET` ≥ 32 chars
- `CRON_SECRET` for `/api/cron/expire-reservations`
- `APP_URL` / `BETTER_AUTH_URL` = public HTTPS origin
- `STORAGE_PROVIDER=local` + persistent disk on Render (or equivalent volume on VPS)

### Cron

```bash
curl -X POST "$APP_URL/api/cron/expire-reservations" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Admin

1. Seed OWNER: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
2. `/admin/login`
3. Bypass only locally: `ADMIN_AUTH_BYPASS=true` + `NODE_ENV=development`

## Docker image

```bash
docker build -t da-shop:latest .
docker run --env-file .env -p 3000:3000 da-shop:latest
```

## Security checklist

- [ ] HTTPS (Render custom domain or reverse proxy)
- [ ] Strong admin password after seed
- [ ] Postgres backups (Render dashboard / dumps)
- [ ] Never commit `.env`

## CI

GitHub Actions: lint, typecheck, unit tests, build (`.github/workflows/ci.yml`).
