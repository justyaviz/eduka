# Eduka Professional Completion Patch

Bu patch foydalanuvchi bergan talablar bo‘yicha demo/local-only yondashuvni qisqartiradi va asosiy CRM logikani real PostgreSQL/API qatlamiga olib chiqadi.

## Qo‘shilgan backend imkoniyatlar

- Talaba profili uchun real API: `/api/students/:id/profile` endi notes, discounts, exams, messages, tasks, gamification, history, groups, payments, attendance va summary qaytaradi.
- Guruh profili uchun yangi real API: `/api/groups/:id/profile`.
- Talaba profili CRUD endpointlari:
  - `/api/students/:id/notes`
  - `/api/students/:id/discounts`
  - `/api/students/:id/messages`
  - `/api/students/:id/tasks`
  - `/api/students/:id/gamification`
  - `/api/students/:id/history`
  - `/api/students/:id/exams`
- Guruh profili CRUD endpointlari:
  - `/api/groups/:id/tasks`
  - `/api/groups/:id/history`
  - `/api/groups/:id/group-exams`
  - `/api/groups/:id/group-homeworks`
  - `/api/groups/:id/group-notes`
- To‘g‘ridan-to‘g‘ri admin CRUD endpointlari:
  - `/api/app/notes`
  - `/api/app/discounts`
  - `/api/app/messages`
  - `/api/app/tasks`
  - `/api/app/gamification`
  - `/api/app/history`
  - `/api/app/exams`
  - `/api/app/group-exams`
  - `/api/app/group-homeworks`
  - `/api/app/group-notes`

## Qo‘shilgan database jadvallar

- `student_notes`
- `student_discounts`
- `crm_messages`
- `student_tasks`
- `gamification_transactions`
- `crm_history`
- `group_exams`
- `group_homeworks`
- `group_notes`

## Demo rejim bo‘yicha o‘zgarish

- `/api/auth/demo` o‘chirildi va 410 qaytaradi.
- `crm-services.js` endi API xatoda avtomatik mock data ko‘rsatmaydi. Mock fallback faqat maxsus test uchun `?demo=1` yoki `localStorage.eduka_allow_demo=1` bo‘lsa ishlaydi.
- Student App backend `DATABASE_URL` bo‘lmasa demo payload qaytarmaydi, 503 xabar beradi.
- Student App frontend demo payloadni faqat maxsus ruxsat berilganda ishlatadi.

## Build

`npm run build` xatosiz tekshirildi.
