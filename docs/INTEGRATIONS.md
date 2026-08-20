# Integrations

All external systems behind provider interfaces. Local default: **mock**.

## Interfaces

### PaymentProvider

- `createPayment`
- `verifyWebhook`
- `getPaymentStatus`
- `refund`

### ShippingProvider

- City / warehouse / locker / address selection
- Rate quote, free-shipping rules
- Create/cancel waybill, tracking, webhook/polling

### EmailProvider / SmsProvider

- Transactional templates
- Marketing only with consent

### StorageProvider

- S3-compatible upload/delete/signed URL
- Mock: local filesystem or in-memory for tests

### AnalyticsProvider

- Ecommerce events (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `search`, …)
- Internal Postgres `AnalyticsEvent` + `DailyMetric` always on
- `ANALYTICS_PROVIDER=mock` — console stub
- `ANALYTICS_PROVIDER=firebase` — GA4 Measurement Protocol (server) + client gtag via `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` / `GA_MEASUREMENT_ID`
- Client: `SiteAnalytics` in store layout (page_view)


## Configuration

- Provider selection via env (`PAYMENT_PROVIDER=mock`, etc.)
- Secrets encrypted at rest when stored in DB settings
- Webhook secrets in env
- Registry maps provider name → implementation

## Ukrainian providers

Real LiqPay/Mono/Nova Poshta adapters added later without changing domain services — only new adapter classes + config.

## Idempotency

`WebhookEvent` unique on `(provider, externalEventId)`. Duplicate deliveries return success without re-applying side effects.
