# Eduka 30.0.0 — CRM Core Pro

## Core modules
- Talabalar Pro: profil, guruhga biriktirish, to'lov/davomat tarixi, qarzdorlik, Student App statusi, avatar, arxiv.
- O'qituvchilar Pro: profil, fan, guruhlar, jadval/davomat ko'rinishi, oylik poydevori, bloklash/aktivlashtirish.
- Guruhlar Pro: profil, o'qituvchi, dars kunlari/vaqti/xona, talabalar, to'lov narxi, davomat va moliya summary.
- To'lovlar Pro: qo'shish, to'lov turi, avtomatik qarzdorlik, chek/QR, bekor qilish.
- Davomat Pro: bugungi guruhlar, tez saqlash endpointi, foiz summary.
- Dashboard Pro: bugungi darslar, to'lovlar, qarzdorlar, guruhlar, o'qituvchilar, davomat statistikasi.
- Search/Filter/Export: global search va CSV export.

## New route
- `/admin/crm-core-pro`

## New API
- `GET /api/app/crm30/overview`
- `GET /api/app/crm30/search?q=`
- `GET /api/app/crm30/students/:id/profile`
- `POST /api/app/crm30/students/:id/assign-group`
- `GET /api/app/crm30/teachers/:id/profile`
- `POST /api/app/crm30/teachers/:id/block|activate`
- `GET /api/app/crm30/groups/:id/profile`
- `GET /api/app/crm30/attendance/today`
- `POST /api/app/crm30/attendance/save`
- `GET /api/app/crm30/payments/:id/receipt`
- `POST /api/app/crm30/payments/:id/cancel`
- `POST /api/app/crm30/debts/recalculate`
- `GET /api/app/crm30/export?type=students|payments|attendance`
