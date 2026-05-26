# Eduka 21.0.2 Hotfix

## Fixes
- Fixed PostgreSQL `column reference "month" is ambiguous` error in dashboard analytics.
- Replaced raw `generate_series ... month` alias with `m.month_start` alias.
- Improved notification popover UI:
  - compact width
  - colored cards
  - readable text
  - glass style
  - max height with scroll
- Improved drawer max width and contrast.
- Keeps Railway settings compatible with `/eduka` root directory.

## Railway
Root Directory: `/eduka`
Build Command: `npm run build`
Start Command: `npm start`
Healthcheck Path: `/`
Target Port: `8080`
