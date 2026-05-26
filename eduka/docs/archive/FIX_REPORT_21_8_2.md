# FIX REPORT 21.8.2

Muammo: `eduka.uz/super/login` ochilganda Super Admin panel o'rniga center CRM menyusi (`Talabalar`, `Guruhlar`, `ilm academy uz`) chiqib qolgan.

Sabablar:
1. Frontendda platform login lokal `adminAccounts` demo login orqali ishlagan.
2. `owner` roli platform super admin deb qabul qilingan, center owner bilan chalkashgan.
3. Eski tenant localStorage sessionlari platform URLda tozalanmagan.
4. `/super/login` eski route bilan ishlatilgan.

Yechim:
- New canonical URL: `/ceo/login`.
- `/super/*` legacy route `/ceo/*`ga almashtiriladi.
- Super Admin auth backend `/api/auth/login` orqali tekshiriladi.
- `owner` endi platform role emas.
- `/ceo/*` route ochilganda tenant UI context tozalanadi.
- `reset-ceo-clean.sql` qo'shildi.
