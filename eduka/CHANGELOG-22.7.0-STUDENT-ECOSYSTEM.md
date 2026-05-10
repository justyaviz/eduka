# Eduka 22.7.0 — Student App Ecosystem Upgrade

This release connects Student App, Admin Gamification, Telegram notifications, feature flags, parent access groundwork, homework/materials/tests tables, and safer database compatibility.

## Included
- Student App real-data payload additions: notifications, homework, tests, materials, ranking, rewards, payments, attendance, coins.
- Admin Student App table API support for notifications, homework, tests, parent access, teacher coin limits.
- Gamification overview API: `/api/app/gamification/overview`.
- Teacher/admin coin award writes notification records and Telegram message when linked.
- Reward redeem writes notification and redemption records.
- Database-safe compatibility tables are created at server startup.
- Hotfix SQL: `backend/hotfix-22.7.0-student-ecosystem.sql`.

## Deploy note
If Railway deploy crashes because of a missing table/column, run `backend/hotfix-22.7.0-student-ecosystem.sql` once in Railway Postgres Query, then redeploy.
