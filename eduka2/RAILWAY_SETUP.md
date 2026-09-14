# Railway setup for EDUKA V3

## Recommended services
Keep only:
1. `eduka-frontend` (rename to `eduka` later if you want) — this V3 Node service
2. `Postgres` — the existing production database and its attached volume

The old `backend/` service is redundant after V3 because the main service now serves both frontend and API. Keep it stopped during verification, then remove it only after you confirm no custom domain or external client points to it.

`function-bun` is not referenced by EDUKA V3. If you did not intentionally create it for another workflow, stop it first, verify EDUKA for a day, then remove it.

Do not delete any Postgres volume before taking a backup and confirming which volume is attached to the active Postgres service.

## Variables for the main EDUKA service
Required:
- `DATABASE_URL` = Railway reference to the active Postgres service
- `JWT_SECRET` = long random secret (keep your current value; do not rotate casually because existing sessions will be invalidated)
- `NODE_ENV=production`
- `BASE_DOMAIN=eduka.uz`

Optional/current:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `EDUKA_VERSION=3.0.0`

For a CEO password reset only:
- set `CEO_EMAIL`
- set a strong `CEO_PASSWORD`
- set `FORCE_CEO_PASSWORD_RESET=true`
- deploy once and confirm login
- immediately change `FORCE_CEO_PASSWORD_RESET=false` and redeploy

## Domains
Attach `eduka.uz` to the V3 service and route `*.eduka.uz` to the same service so tenant URLs such as `markaz.eduka.uz` reach the tenant router.

## Health check
Railway health path: `/api/health`

## Verification sequence
1. `https://eduka.uz/api/health` returns `ok: true`.
2. CEO login works.
3. Convert one demo request to a center or use an existing center.
4. Open `<subdomain>.eduka.uz` and log in with its `center_users` credentials.
5. Refresh the page: it must stay authenticated.
6. Create a course, room, teacher, student, group, attach student, and payment.
7. Confirm data remains after a refresh.
