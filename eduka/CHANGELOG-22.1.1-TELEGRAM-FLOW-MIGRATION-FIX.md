# Eduka 22.1.1 — Telegram Flow + Migration Crash Fix

## Fixed
- Railway crash fixed for PostgreSQL error `42703` by adding compatibility `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements for old `student_app_settings` and `student_app_modules` tables.
- Student App 22 gamification migration is now safe on existing Railway databases.
- Server schema bootstrap also aligns old Student App tables before runtime queries.

## Telegram Bot Flow
- `/start` now checks if the Telegram user is already linked.
- If linked: the bot does not ask registration again and shows the Student App open button.
- If not linked: the bot asks for phone number, then password.
- After correct password: bot shows student details and asks for confirmation: “Shu sizmi?”
- After confirmation: Telegram user ID and chat ID are linked to the student profile and a Student App button is shown.
- The Student App button opens directly to `/app/home` with a session token.

## Build
- `npm run build` passed with 0 syntax errors.
