# Eduka 22.1.5 — Student App Telegram WebApp Script Fix

## Fixes
- Added Telegram WebApp SDK to `student-app.html`.
- Student App now waits briefly for `window.Telegram.WebApp` before deciding that there is no Telegram session.
- `/app/home` and `/app/login` no longer show an internal login form; they attempt token or Telegram initData auto-login first.
- If token is present, Student App always opens `/app/home` directly.
- If Telegram WebApp menu opens without URL token, app authenticates through `/api/student-app/auth/telegram` using Telegram initData/user ID.

## Version
- 22.1.5
