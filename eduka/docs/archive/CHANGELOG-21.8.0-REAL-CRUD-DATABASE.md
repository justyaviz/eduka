# Eduka 21.8.0 — Real CRUD & Database Update

## Asosiy maqsad
21.7.0 production-core poydevoridan keyin 21.8.0 versiyada real database workflow kuchaytirildi: export, profile alias, payment cancel, migration runner va frontend real-action layer qo'shildi.

## Qo'shildi
- `/api/app/export/students`
- `/api/app/export/groups`
- `/api/app/export/teachers`
- `/api/app/export/payments`
- `/api/app/export/attendance`
- `/api/app/export/debts`
- `/api/app/students/:id/profile`
- `/api/app/groups/:id/profile`
- `/api/app/payments/:id/cancel`
- `frontend/eduka-real-crud.js`
- `frontend/eduka-real-crud.css`
- `backend/migrations/008_real_crud_export_core.sql`
- `schema_migrations` migration tracking

## Yaxshilandi
- Export tugmalari endi serverdan CSV fayl yuklaydi.
- Payment rowlarda bekor qilish quick action tayyorlandi.
- Global search profile routes `/api/app/...` aliaslari bilan moslashtirildi.
- Build script yangi frontend real CRUD layerni ham tekshiradi.
- Health version 21.8.0 ga yangilandi.

## Tekshiruv
`npm run build` — 0 syntax error.
