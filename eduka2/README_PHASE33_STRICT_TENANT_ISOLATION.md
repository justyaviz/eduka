# EDUKA Phase 3.3 — Strict Tenant Isolation

Bu fix EDUKA CRM oqimini to‘g‘ri real holatga keltiradi.

## To‘g‘ri biznes oqim
1. CEO panelga demo ariza tushadi
2. CEO o‘quv markaz yaratadi
3. O‘quv markazga subdomain beriladi
4. Login/parol yaratiladi
5. Telegramga link + login/parol yuboriladi
6. O‘quv markaz subdomain orqali kiradi
7. Login qilgandan keyin o‘zining bo‘sh CRM paneli ochiladi
8. Har bir subdomain ma’lumotlari alohida saqlanadi

## Muhim o‘zgarish
Oldingi versiyada subdomain topilmasa avtomatik tenant yaratilishi mumkin edi.
Bu versiyada bunday bo‘lmaydi.

Agar subdomain CEO panelda yaratilmagan bo‘lsa:
- CRM ochilmaydi
- “O‘quv markaz topilmadi” sahifasi chiqadi
- Support phone va Telegram chiqadi

## Test
1. CEO orqali markaz yarat:
   POST /api/ceo/create-center-admin
2. Response ichida url/login/password chiqadi
3. Shu subdomainni och:
   https://subdomain.eduka.uz
4. Login chiqadi
5. Login qilgandan keyin CRM ochiladi

## Tenant isolation
Barcha CRM tablelarda tenant ustuni orqali ajratiladi.
jun.eduka.uz ma’lumotlari boshqa subdomainlarda ko‘rinmaydi.
