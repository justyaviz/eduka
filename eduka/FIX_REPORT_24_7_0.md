# FIX REPORT — Eduka 24.7.0

## Tekshiruvlar
- Backend syntax: OK
- Frontend Student App syntax: OK
- Service worker: OK
- Manifest: OK

## Deploydan keyin kerak bo'lishi mumkin
Agar Railway'da `student_app_sessions` yoki `student_app_settings` column xatosi chiqsa, Postgres Query'da quyidagini run qiling:

`backend/hotfix-24.7.0-student-app-full-system.sql`

## Test URL
- `https://eduka.uz/app/home?v=2470`
- `https://student.eduka.uz/?v=2470`
- Telegram bot: `/start` → Student App'ni ochish
