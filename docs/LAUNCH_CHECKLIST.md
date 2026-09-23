# Soft-launch checklist (D&A Shop)

## Before opening prepaid checkout

- [ ] Custom domain Certificate Issued (`dsa-anime.shop` + `www`)
- [ ] Open only via **https://** (not http)
- [ ] `APP_URL` / `BETTER_AUTH_URL` = `https://dsa-anime.shop`
- [ ] `AUTH_TRUSTED_ORIGINS` includes shop + `https://dsa-shop.onrender.com`
- [ ] `ADMIN_AUTH_BYPASS=false`
- [ ] `DATABASE_SSL=true`, Internal `DATABASE_URL`
- [ ] Rotate DB password + admin password (if ever shared)
- [ ] `FOP_NAME` + `FOP_IBAN` (+ EDRPOU / bank)
- [ ] `PAYMENT_PROVIDER=wayforpay` **or** bank-transfer-only with admin confirm
- [ ] WayForPay merchant keys + domain verified
- [ ] `EMAIL_PROVIDER=resend` (or smtp) + `EMAIL_FROM`
- [ ] `CRON_SECRET` + scheduled hit to `/api/cron/expire-reservations`
- [ ] Uploads disk mounted (`STORAGE_PROVIDER=local`)
- [ ] Seed staff; create extra roles via `/admin/staff`
- [ ] Publish products only after checklist (category, SKU, price, photo)

## Smoke

1. Place BANK_TRANSFER order → pay page shows FOP requisites  
2. Admin → Підтвердити оплату → stock converts, email “paid”  
3. ONLINE order with WayForPay (test mode)  
4. Non-OWNER staff cannot open `/admin/content`  
5. Mock settle returns error on production  

## Security expectations

- Order pay/success requires HMAC `token`  
- Mock webhook/settle disabled in production  
- Page-level RBAC + action asserts  
