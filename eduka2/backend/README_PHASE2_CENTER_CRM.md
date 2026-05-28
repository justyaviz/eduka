# EDUKA Phase 2 — Center CRM Core

Qo'shildi:
- /app/login
- /app/dashboard
- /app/students
- /app/groups
- /app/payments
- /app/attendance
- /app/reports
- /app/settings

API:
- POST /api/app/login
- GET /api/app/me
- GET /api/app/dashboard
- GET/POST/PATCH /api/app/students
- GET/POST /api/app/groups
- GET/POST /api/app/payments
- GET/POST /api/app/attendance

Demo so'rovni markazga aylantirganda:
- centers ichida yangi markaz yaratiladi
- center_users ichida director login yaratiladi
- response ichida centerAdmin email/password qaytadi
- Telegram xabarda login/parol chiqadi

Deploydan keyin:
- /api/debug/init-db oching
- /ceo/login orqali demo so'rovni markazga aylantiring
- /app/login orqali center admin bilan kiring
