# Recover a failed migrate on Render (orders missing)

If `20260715153000_return_requests` failed with `relation "orders" does not exist`:

1. Deploy latest `main` (includes migration `20260715140000_commerce_and_content`).
2. In Render **Shell** (after the new deploy finishes):

```bash
# Clear failed migration flag
./node_modules/.bin/prisma migrate resolve --rolled-back 20260715153000_return_requests

# Apply remaining migrations (commerce first, then returns, …)
./node_modules/.bin/prisma migrate deploy

# Seed catalog / admin
./node_modules/.bin/tsx prisma/seed.ts
```

3. Open `https://dsa-shop.onrender.com/admin/login`.
