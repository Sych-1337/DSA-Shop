# Recover failed Prisma migrate on Render

## Current state (return enums already exist)

If `20260715153000_return_requests` fails with `type "ReturnRequestStatus" already exists`:

**Option A — fix now (current image, no wait):**

```bash
./node_modules/.bin/prisma db execute --stdin <<'SQL'
DROP TYPE IF EXISTS "ReturnItemResolution" CASCADE;
DROP TYPE IF EXISTS "ReturnReason" CASCADE;
DROP TYPE IF EXISTS "ReturnRequestStatus" CASCADE;
SQL

./node_modules/.bin/prisma migrate resolve --rolled-back 20260715153000_return_requests
./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/tsx prisma/seed.ts
```

**Option B — after latest `main` deploys** (migration is idempotent):

```bash
./node_modules/.bin/prisma migrate resolve --rolled-back 20260715153000_return_requests
./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/tsx prisma/seed.ts
```

Then open `/admin/login`.

## Earlier failure (`orders` does not exist)

That is fixed by migration `20260715140000_commerce_and_content`. If that never applied, deploy latest `main` first, then run Option A or B.
