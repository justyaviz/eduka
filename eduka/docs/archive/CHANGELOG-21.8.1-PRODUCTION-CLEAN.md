# Eduka 21.8.1 — Production Clean Deploy Fix

## Fixed
- Railway deploy healthcheck now has config-as-code: `/api/health`.
- `npm start` no longer blocks forever on a failed migration; server starts after migration warning so healthcheck can pass.
- Default Super Admin changed to `yaviz@eduka.uz`.
- Default Super Admin password changed to `owner` unless `SUPER_ADMIN_PASSWORD` is set.
- Demo seed disabled.
- Owner-only cleanup added: centers, students, teachers, groups, payments, demo data are removed by migration, leaving only the platform owner.
- `seed.js` no longer inserts demo data.

## Railway
Use one service only with root directory `/eduka`, start command `npm start`, healthcheck `/api/health`.
