# Eduka 31.0.2 — Pro Render Lock Fix

- Fixed issue where `/admin/dashboard` first showed CRM Real Workflow UI and after 10–20 seconds switched back to legacy dashboard.
- Legacy app.js renderers are skipped on primary Pro CRM routes.
- Added Pro Render Lock observer to restore Pro UI if any old script overwrites the active route.
- Added cache busting version 31.0.2 for affected CSS/JS.
