# CEO Eskiz SMS

Open `/ceo/sms`. Configure real `ESKIZ_EMAIL`, `ESKIZ_PASSWORD`, and `ESKIZ_FROM` (default `4546`) on the Railway service that serves eduka.uz. Express and pg already exist in package.json.

- “Ulanishni tekshirish” authenticates without sending a message.
- Sending requires an active CEO user, bearer JWT and an apex host. Tenant users cannot spend the platform SMS balance.
- `/api/sms/send` accepts `{ "phone": "998XXXXXXXXX", "message": "..." }`. Include `Authorization: Bearer <CEO session JWT>` and a stable `Idempotency-Key` (UUID). Never use an Eskiz token in the browser. Without a request key, a one-minute request fingerprint is used; callers should always supply a stable key for retries.
- GET `/api/sms/status`, POST `/api/sms/check`, GET `/api/sms/history` are CEO-only too.
- Migration 014 creates `eskiz_tokens` and `eduka_sms_messages`. Tokens are AES-256-GCM encrypted using a domain-separated key derived from `EDUKA_INTEGRATION_KEY`, falling back to `JWT_SECRET`. Rotating the key invalidates cached tokens; the next request authenticates again.
- Tokens are cached for at most one day (or their JWT expiry if earlier). An explicit 401 triggers one login/refresh and one retry. Ambiguous network failures are never automatically retried.
- `accepted` means Eskiz accepted the request, not delivered to a handset. Delivery receipts/webhooks are not implemented. `unknown` and stale `processing` records require checking the Eskiz dashboard before another send.
- This release adds manual CEO SMS sending only; tenant automatic SMS rules are separate work.

Official API documentation linked from https://eskiz.uz/sms:
https://documenter.getpostman.com/view/663428/RzfmES4z?version=latest

Tests use a synthetic provider; no real recipient is contacted by the automated test suite.
