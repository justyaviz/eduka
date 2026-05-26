# Eduka changelog

## 32.4.1 — Production Hardening & Platform Cleanup

- Added security headers to JSON and static responses.
- Added request id header for easier Railway debugging.
- Added API rate limiting with `EDUKA_API_RATE_LIMIT_PER_MINUTE`.
- Added `/api/system/status` and `/api/super/system-status` for super admin diagnostics.
- Added production preflight script: `npm run check:production`.
- Added DB backup helper: `npm run backup:db`.
- Updated frontend cache versions to `32.4.1`.
- Moved old changelog/fix reports to `docs/archive`.
- Added deployment and security docs.

## 32.3.1 — Production Safety Fix

- Disabled automatic owner reset by default.
- Protected AI admin APIs.
- Protected AI webhook management.
- Sanitized production errors.
