# EDUKA Payme Merchant API

## Implemented
POST https://eduka.uz/api/payme implements CheckPerformTransaction, CreateTransaction, PerformTransaction, CancelTransaction, CheckTransaction, GetStatement and SetFiscalData. Own JSON parser accepts application/json and text/json; RPC errors use HTTP 200. Callback authentication uses Basic Paycom:<key>, constant-time comparison, separate test/live keys. Never log or put keys in the frontend.

Authenticated center owner/director/admin/administrator creates invoices through POST /api/crm/subscription/checkout with a UUID requestId. Order amount is server-derived in tiyin, immutable after creation. Current active tariff is renewed for **30 days**; positive center monthly_payment overrides tariff.monthly_price. No client-supplied amount or tariff change is accepted. Existing pending invoices are reused. Payme callbacks, not the return URL, confirm payment.

GET /api/crm/subscription/orders/:id is tenant/role scoped. UI polls at most 60 times, has manual refresh and a fiscal receipt link after SetFiscalData. A test payment never changes real subscription or platform revenue. Live payment atomically records one platform payment and extends from the later of now, paid expiry or active trial expiry. Retries are idempotent.

Cancelled pending payments use state -1; completed then cancelled use -2. Cancelling the latest unchanged live subscription restores its previous dates/status atomically. If a later renewal/CEO edit changed the entitlement, -31007 prevents overwriting that later work: reconcile with administrator first. Unpaid provider transactions expire at 12 hours, reason 4; invoice creation window is 24 hours. GetStatement includes inclusive provider time range, ascending order, all successful creates regardless of subsequent state. Fiscal sale and cancellation data are stored separately.

Expired centers may authenticate and access ONLY session and subscription endpoints; other center APIs remain blocked. Suspended/Blocked centers remain blocked. Historical Payme records survive center removal with null center references, so callback retries cannot create duplicate credits for a deleted center.

## Railway variables (eduka-frontent service)
- PAYME_MERCHANT_ID: web cashbox ID verified in Payme Business.
- PAYME_TEST_KEY: sandbox key, server only.
- PAYME_KEY: live key, server only. Must differ from test key.
- PAYME_MODE: test initially; live after sandbox acceptance.
- PAYME_LIVE_ENABLED: false initially; true only after live merchant configuration is verified.
- Optional fiscal item mapping: PAYME_MXIK, PAYME_PACKAGE_CODE, PAYME_VAT_PERCENT. Use accountant/Payme-confirmed values; do not guess tax classification. When all are present, CheckPerformTransaction returns detail.items. Otherwise verify fiscal items are configured in Payme cashbox before launch.

Both Railway services run this repository but eduka.uz and wildcard tenant domains route to eduka-frontent. Configure whichever service actually receives the callback and checkout requests. All services must share the same database. Do not send secrets in chat or commit them.

## Required Payme Business settings
A billing-enabled web cashbox is needed. Set callback/Endpoint URL to https://eduka.uz/api/payme; Basic login Paycom, matching key; account field **order_id**, string (UUID), one-time account. Test against sandbox with a test-mode invoice created in EDUKA. Run both sandbox scenarios including duplicate creates/performs/cancels, invalid auth/account/amount and GetStatement. Then verify fiscal mapping and switch mode/live flag. Redirects/payment-page visits alone do not prove integration acceptance.

## Verification limits
Automated tests use an isolated database and synthetic credentials. They verify API contract, exact amount conversion, idempotency, authorization, tenant isolation, timeout persistence, real/test separation, statement boundaries, renewals, refunds, and fiscal data storage. They are NOT a real Payme sandbox certification or bank-card payment. Actual provider acceptance requires Payme cabinet access and the correct cashbox settings. No automatic recurring card debit is implemented; each renewal is explicitly paid in Payme checkout.

Sources: https://developer.help.paycom.uz/metody-merchant-api/ ; https://developer.help.paycom.uz/pesochnitsa/ ; https://developer.help.paycom.uz/initsializatsiya-platezhey/otpravka-cheka-po-metodu-get/

## Configuration checkpoint — 2026-10-02 (Asia/Tashkent)
The existing Eduka cashbox is Payme GO (6abe48ecb3bf8da2d9c357a4), not the billing web cashbox. Created **EDUKA Obuna**, web cashbox **6abed42e78047678d044f5e1**, in the existing business. Verified Endpoint URL https://eduka.uz/api/payme and added account field order_id with UUID validation and Russian/Uzbek/English display labels. The cabinet currently shows this web cashbox as **inactive**. Both distinct keys were transferred to Railway eduka-frontent server variables; mode remains test, live enabled remains false. No keys are stored in this repository. Provider sandbox acceptance, fiscal mapping, cashbox activation and a real payment are still outstanding. Do not enable live solely because server variables exist.
