# Eduka 21.8.3 — CEO hard login router fix

- `/ceo/login` now returns a dedicated standalone CEO login page, not the CRM app shell.
- `/super/login` returns the same standalone CEO login page for backwards compatibility.
- Old tenant/center browser state is cleared before CEO login.
- CEO login accepts only `super_admin`, `platform_owner`, or `platform_admin` roles.
- `/ceo/dashboard` now maps to the real Super Admin dashboard.
- Static `ilm academy uz` placeholders were removed from the main app shell.
- Health endpoint reports version 21.8.3.
- Updated `backend/reset-ceo-clean.sql` for full clean reset + one Super Admin.
