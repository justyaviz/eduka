# Eduka 22.1.7 — Gamification Tables Crash Fix

## Fixed
- Railway crash `relation "student_reward_products" does not exist` fixed.
- Added runtime-safe `ensureStudentGamificationTables()` before reward inserts/selects.
- Added migration `013_student_gamification_tables_safe.sql`.
- Added manual Railway hotfix SQL `backend/hotfix-22.1.7-gamification-tables.sql`.

## Student App
- Keeps Telegram/bot auto-login flow from 22.1.6.
- Student App opens from tokenized `/app/open/:token` or Telegram session.
