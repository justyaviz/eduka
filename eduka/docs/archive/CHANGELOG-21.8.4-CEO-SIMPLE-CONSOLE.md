# Eduka 21.8.4 — CEO Simple Functional Console

## Maqsad
CEO/Super Admin qismini o‘quv markaz CRM’dan to‘liq ajratish. Murakkab UI o‘rniga oddiy, barqaror va funksional platforma boshqaruv paneli berildi.

## Qilinganlar
- `/ceo/login` alohida login sahifa bo‘lib qoladi.
- `/ceo/dashboard`, `/ceo/centers`, `/ceo/plans`, `/ceo/subscriptions`, `/ceo/payments`, `/ceo/support`, `/ceo/admins`, `/ceo/audit`, `/ceo/settings` endi CRM `app.html` emas, alohida `ceo-console.html` orqali ochiladi.
- Chap menyuda o‘quv markaz bo‘limlari chiqmaydi.
- CEO console ichida quyidagilar bor:
  - Dashboard KPI
  - O‘quv markazlar ro‘yxati
  - Yangi markaz qo‘shish
  - Markazni bloklash/aktivlashtirish
  - Markaz tarifini o‘zgartirish
  - Markaz ruxsatlarini feature flag orqali boshqarish
  - Tarif qo‘shish/tahrirlash
  - Obunalar
  - Platforma to‘lovlari
  - Support
  - CEO adminlar
  - Audit log
- Yangi frontend fayllar:
  - `frontend/ceo-console.html`
  - `frontend/ceo-console.css`
  - `frontend/ceo-console.js`
- Yangi backend endpointlar:
  - `PUT /api/super/centers/:id/plan`
  - `PUT /api/super/centers/:id/features`
- Health version: `21.8.4`
