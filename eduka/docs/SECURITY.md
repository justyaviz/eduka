# Eduka security notes

Eduka 32.4.1 adds production hardening:

- JSON/static responses include security headers.
- API rate limit is enabled by default.
- AI Assistant admin APIs require super admin session.
- AI webhook management requires super admin session.
- Owner reset is disabled unless `EDUKA_ALLOW_OWNER_RESET=1`.
- Production errors are sanitized.
- DB image fallback is disabled by default in `.env.example`.

## Never do in production

- Do not use `SUPER_ADMIN_PASSWORD=owner`.
- Do not set `EDUKA_ALLOW_OWNER_RESET=1` unless you are intentionally wiping tenant data.
- Do not enable `ASSET_UPLOAD_FALLBACK=database` for real clients.
- Do not share Railway logs containing secrets.
