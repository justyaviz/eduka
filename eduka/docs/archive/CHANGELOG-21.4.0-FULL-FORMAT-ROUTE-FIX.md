# Eduka 21.4.0 Full Format & Route Fix

## Main changes
- `/app` now serves the Student App.
- `/admin` now serves the CRM admin panel.
- Old `/student-app` redirects to `/app`.
- Landing login button points to `/admin`.
- CRM internal routes use `/admin/...` instead of `/app/...`.
- Student test login fallback supports `+998931949200 / 8888` when no app password hash exists.
- Added `docs/eduka-21-4-production-safety.sql` for Railway Postgres safety checks.
- Cache versions bumped to `21.4.0`.

## Railway
Root Directory: `/eduka`
Build Command: `npm run build`
Start Command: `npm start`
Healthcheck Path: `/`
Target Port: `8080`
