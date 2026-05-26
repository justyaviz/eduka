# Eduka 21.8.2 — CEO Login & Router Fix

## Tuzatildi
- Platform owner URL `/ceo/login` qilindi.
- Eski `/super/login` avtomatik `/ceo/login`ga redirect qiladi.
- Super admin login endi frontend ichidagi demo/local login bilan emas, backend `/api/auth/login` orqali ishlaydi.
- Client-side demo admin accountlar olib tashlandi.
- `owner` roli super admin sifatida qabul qilinmaydi; faqat `super_admin`, `platform_owner`, `platform_admin` platform panelga kira oladi.
- `/ceo/*` sahifalarida eski tenant/local center sessionlari tozalanadi, shuning uchun `ilm academy uz` menyusi chiqib ketmaydi.
- CEO panelda CRM sidebar emas, platform admin sidebar chiqishi uchun route guard kuchaytirildi.
- Backend `/super/login` legacy route uchun `/ceo/login` redirect qo'shildi.
- `ceo` reserved subdomain ro'yxatiga qo'shildi.

## Login
- URL: `https://eduka.uz/ceo/login`
- Email: `yaviz@eduka.uz`
- Parol: `owner`

## Database reset
`backend/reset-ceo-clean.sql` fayli qo'shildi. Railway Postgres Query ichida ishlatish mumkin.
