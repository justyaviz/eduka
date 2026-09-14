# EDUKA V3 Production

This build consolidates EDUKA into one Node/Express service with PostgreSQL.

## Canonical architecture
- `centers` = tenant source of truth
- `center_users` = CRM authentication source of truth
- JWT = one authentication method for CRM
- `/api/tenant/*` = tenant status/login
- `/api/app/*` = authenticated CRM API
- `/api/ceo/*` = CEO API
- `public/` = landing + CEO + CRM UI

The legacy `real-crm-engine.js`, Phase 3.2–4.0 runtime patch chain, and duplicate backends are intentionally not included.

## Deploy
1. Use this folder as the Railway service root.
2. Add `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`.
3. Keep Telegram variables if Telegram notifications are used.
4. Deploy. Database migrations run automatically after server startup.
5. Verify `/api/health`, CEO login, one tenant login, student/course/group save, and refresh.

## Important
Before the first V3 deployment, create a Railway Postgres backup. Migration `003_security_cleanup.sql` migrates legacy plaintext tenant passwords into `center_users`, disables the old plaintext values, and removes the obsolete demo password column.
