# Eduka 31.0.0 — Academy Operations Pro

## Qo'shildi
- Schedule builder: guruh, o'qituvchi, xona, kun va vaqt asosida dars jadvali.
- Xona/filial poydevori va xona bandligi nazorati.
- O'qituvchi va xona to'qnashuvini tekshiruvchi API.
- Bugungi darslar live dashboard.
- Dars statuslari: pending/live/completed/cancelled.
- Davomatni lesson instance bilan bog'lash.
- Dars yakuni summary: mavzu, uyga vazifa, izoh, attendance summary.
- O'qituvchi jadvali va guruh jadvali endpointlari.
- Admin UI: /admin/operations va /admin/schedule uchun Academy Operations Pro ekrani.

## API
- GET /api/app/operations31/overview
- GET/POST /api/app/operations31/rooms
- GET/POST /api/app/operations31/schedule
- GET /api/app/operations31/schedule/conflicts
- GET /api/app/operations31/today-lessons
- POST /api/app/operations31/lessons/:id/status
- GET/POST /api/app/operations31/lessons/:id/attendance
- POST /api/app/operations31/lessons/:id/summary
- GET /api/app/operations31/teacher-schedule
- GET /api/app/operations31/groups/:id/schedule
