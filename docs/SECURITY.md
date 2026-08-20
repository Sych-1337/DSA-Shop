# Security

## Principles

- Secrets only via environment variables
- Zod validation on all inputs
- Server-side permission checks
- CSRF-safe mutations (SameSite cookies + origin checks / server actions patterns)
- Rate limiting on auth, checkout, webhooks
- Password hashing via Better Auth
- Webhook signature verification + replay protection via unique event ids
- Idempotency keys on checkout payment initiation
- Encrypt sensitive integration settings
- File uploads: MIME, size, safe processing
- No unsanitized HTML
- Prisma parameterized queries
- Audit log for sensitive changes (no passwords/secrets in audit payloads)
- Separate development and production configs
- Destructive admin actions: confirmation + optional reason

## Money & inventory

- No float money
- Server recalculates cart/checkout totals
- Stock changes only through movements inside transactions
- Overselling protection: transactional available check + row lock/version

## Privacy

- No card data stored
- Consent storage for analytics/marketing
- Account anonymization/deletion path
- Error logs must not leak secrets or PII unnecessarily

## Admin

- Strong passwords, verified email
- Session revocation
- Login audit
- Role least privilege
