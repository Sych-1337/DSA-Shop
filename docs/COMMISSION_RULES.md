# Commission Rules

## Commercial rule

- Year 1: **7%** of eligible website sales
- Switch to **4%** earlier if agreed development payoff target is fully paid
- After year 1 (or after payoff): **4%** while developer continues admin/support/SEO
- Terms stored in `CommissionAgreement`

## Eligible base (default)

```text
eligible completed website product subtotals
  − product refunds
  − cancellations affecting eligibility
```

**Exclude:** shipping charged, unpaid orders, cancelled orders, returned product amounts, manual Instagram/phone orders unless agreement includes them.

Order included only when:

- Paid
- Delivered/completed (eligible lifecycle state)
- Not cancelled
- Not fully returned
- Source in agreement-eligible set (default `WEBSITE`)

## Rate switch

First of:

1. One year from agreement start
2. Accumulated development payout ≥ payoff target

Record dated `CommissionRatePeriod`, audit log entry.

## Settlements

- Usually calendar month
- Draft → review → **lock**
- Locked periods not silently recalculated
- Late returns → `CommissionAdjustment` in a later period
- Payout tracked in `CommissionPayment`

## Line item fields

Order id/number, source, eligible subtotal, excluded shipping, returns, adjustment, base, rate, commission amount, inclusion reason, payout status.

## Access

- Server-side calculation only
- Rate change: permission + reason + audit
- Periods never physically deleted
- Developer can read line breakdown; COGS optional separately

## Tests required

7%, 4%, year switch, payoff switch, partial/full refund, excluded shipping, manual order exclusion, late return after lock, duplicate calculation prevention.
