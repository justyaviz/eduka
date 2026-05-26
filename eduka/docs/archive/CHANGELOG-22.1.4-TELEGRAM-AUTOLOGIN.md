# Eduka 22.1.4 — Student App Telegram Auto Login Token Fix

- Student App ichidagi login/parol flow olib tashlandi.
- Telegram bot tasdiqlagan o'quvchi uchun tokenli link saqlanadi va dashboard ochiladi.
- Telegram WebApp menyu tugmasidan token yo'q ochilganda ham `initData` orqali avtomatik session yaratadi.
- `/api/student-app/auth/telegram` endpoint qo'shildi.
- `student_app_sessions` compatibility migration va hotfix SQL qo'shildi.
- Eski Railway Postgres uchun `schedule_enabled` va boshqa Student App ustunlari safe tarzda qo'shiladi.
