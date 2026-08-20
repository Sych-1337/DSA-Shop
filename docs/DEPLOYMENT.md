# Deployment

## Local / VPS (recommended MVP)

1. Clone repo, copy `.env.example` → `.env`, set strong secrets.
2. Start Postgres: `docker compose up -d postgres`
3. `pnpm install && pnpm db:push` (or migrate when consent given) && `pnpm db:seed`
4. `pnpm build && pnpm start` (or `pnpm dev` for development)

### Critical production env

- `ADMIN_AUTH_BYPASS` must be **unset** or `false`
- `BETTER_AUTH_SECRET` ≥ 32 chars, unique
- `CRON_SECRET` for `/api/cron/expire-reservations`
- `APP_URL` / `BETTER_AUTH_URL` = public HTTPS origin

### Cron

Call every 5–15 minutes:

```bash
curl -X POST "$APP_URL/api/cron/expire-reservations" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Admin access

1. Seed creates OWNER staff: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
2. Open `/admin/login`
3. Local-only bypass: `ADMIN_AUTH_BYPASS=true` + `NODE_ENV=development` (forbidden in production code path)

## Docker image

```bash
docker build -t da-shop:latest .
docker run --env-file .env -p 3000:3000 da-shop:latest
```

App expects Postgres reachable via `DATABASE_URL`. Use `docker-compose.yml` for DB or manage Postgres separately.

## Security checklist

- [ ] HTTPS reverse proxy (Caddy/Nginx)
- [ ] Firewall: only 80/443 (+ SSH)
- [ ] Backups of Postgres
- [ ] Rotate webhook / cron secrets
- [ ] Verify security headers from `next.config.ts`
- [ ] Confirm `/admin`, `/cart`, `/checkout` are noindex

## CI

GitHub Actions runs lint, typecheck, unit tests, and build on push/PR (see `.github/workflows/ci.yml`).
