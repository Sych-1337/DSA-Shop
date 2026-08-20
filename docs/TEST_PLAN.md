# Test Plan

## Unit

- Money helpers (add, percent, format)
- Promotion engine
- Stock availability / reservation math
- Commission calculations and rate switches
- Order status transition guards
- Permission checks
- Order total calculation

## Integration

- Create cart → add item → merge on login
- Checkout + reservation
- Payment webhook success + duplicate webhook
- Shipment update
- Refund + return + restock
- Commission settlement lock + late return adjustment
- Concurrent last-item purchase

## E2E (Playwright)

- Browse catalog, filter, open product, select size, add to cart
- Guest checkout with mock payment
- Login / account
- Admin login → create product → process order → shipment
- Return and refund
- Commission report view
- Light/dark theme switch

## Quality gates (each phase)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Update `docs/STATUS.md` after each phase.
