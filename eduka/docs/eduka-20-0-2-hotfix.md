# Eduka 20.0.2 Railway Migration Hotfix

This hotfix fixes Railway migration crashes caused by duplicate `users.normalized_phone` values in existing production databases.

## Changes

- Keeps existing users instead of deleting them.
- Renames duplicate `normalized_phone` values with safe `legacy-<id>-...` placeholders before unique indexes are applied.
- Clears platform owner phone conflicts before seeding `admin@eduka.uz`.
- Keeps email as the primary platform owner login.

## Test

Run:

```bash
npm run migrate
npm run build
```
