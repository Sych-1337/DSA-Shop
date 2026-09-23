# Integrations

All external systems behind provider interfaces.

## PaymentProvider

- `createPayment` / `verifyWebhook` / `getPaymentStatus` / `refund`
- Drivers: `PAYMENT_PROVIDER=mock` (dev only) | `wayforpay`
- Soft launch methods: `BANK_TRANSFER` (FOP + admin confirm) | `ONLINE` (WayForPay)
- Webhooks: `/webhooks/payments/wayforpay`, `/webhooks/payments/mock` (non-prod + secret)

## ShippingProvider

- Still `mock` for quotes / cities. Admin saves real TTN manually.

## EmailProvider

- `mock` | `resend` | `smtp`
- Env: `EMAIL_FROM`, `RESEND_API_KEY` or `SMTP_*`

## StorageProvider

- `local` (Render disk) | `supabase`

## AnalyticsProvider

- `mock` | `firebase` / GA4

## Config

See `.env.example` and `docs/LAUNCH_CHECKLIST.md`.
