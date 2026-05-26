# Eduka 32.4.0 deployment

## Railway root
`eduka`

## Commands
- Install: `npm install`
- Build: `npm run build`
- Start: `npm start`

## Required variables
```env
NODE_ENV=production
EDUKA_VERSION=32.4.0
DATABASE_URL=...
SUPER_ADMIN_EMAIL=...
SUPER_ADMIN_PASSWORD=strong_random_16_plus_chars
STUDENT_APP_SESSION_SECRET=strong_random_secret
TELEGRAM_WEBHOOK_SECRET=strong_random_secret
EDUKA_ALLOW_OWNER_RESET=0
EDUKA_RATE_LIMIT_ENABLED=1
EDUKA_API_RATE_LIMIT_PER_MINUTE=240
ASSET_UPLOAD_FALLBACK=off
```

## Preflight
Run before production:

```bash
npm run build
npm run check:production
```

## Health
- Public: `/api/health`
- Super admin only: `/api/system/status`
