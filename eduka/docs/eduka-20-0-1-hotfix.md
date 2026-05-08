# Eduka 20.0.1 Railway Migration Hotfix

This hotfix fixes Railway deploy crashes caused by PostgreSQL `ON CONFLICT` statements running against older production tables that did not yet have exact unique constraints.

## Fixed

- Added production hardening step in `backend/migrate.js` before seeding platform owner.
- Added exact unique indexes required for:
  - `ON CONFLICT (email)`
  - `ON CONFLICT (organization_id)`
  - `ON CONFLICT (organization_id, feature_key)`
  - `ON CONFLICT (organization_id, name)`
  - `ON CONFLICT (role_id, permission_key)`
- Cleaned duplicate rows safely before creating indexes.

## Deploy

Push this version to GitHub. Railway start command already runs:

```bash
npm run migrate && node backend/server.js
```

No `package-lock.json` is included to avoid private registry lock issues.
