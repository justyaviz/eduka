# Eduka 19.7 — No Demo Final + Production Hardening

Bu versiyada 19.6 da qolgan production xavflari yopildi.

## Bajarilgan ishlar

- CRM login sahifasidan `Tezkor kirish` demo tugmasi olib tashlandi.
- `/api/auth/demo` doimiy ravishda 410 qaytaradigan qilib qoldirildi.
- `crm-services.demoLogin()` butunlay o'chirildi.
- `crm-mock.js` production app sahifasidan uzildi.
- Production hostlarda CRM localStorage data fallback o'chirildi.
- API xato bersa fake ma'lumot ko'rsatish o'rniga real xato/empty state chiqadi.
- Student App preview/demo faqat localhost + `localStorage.eduka_allow_demo=1` bo'lgandagina ishlaydi.
- Student App imtihon sahifasida reference/demo natija chiqarish olib tashlandi.
- Backenddagi `fallbackStudentAppPayload()` demo ma'lumot qaytarmaydi.
- Start komandasi migratsiyani avtomatik yuritadi: `npm run migrate && node backend/server.js`.
- Versiya `19.7.0` ga ko'tarildi.

## Deploydan keyin tekshirish

1. Railway build xatosiz o'tishi kerak.
2. Start vaqtida migrate ishlashi kerak.
3. Super Admin login:
   - Email: `admin@eduka.uz`
   - Parol: `12345678` yoki Railway envdagi `SUPER_ADMIN_PASSWORD`
4. Yangi markaz yaratish wizardini test qiling.
5. Yaratilgan markaz admin login/paroli bilan kirib ko'ring.
6. Student App token/parolsiz demo ma'lumot ko'rsatmasligi kerak.

## Muhim

Real SMS, Telegram, DNS/SSL va payment providerlar token/kalitlar ulangandan keyin tashqi servisga chiqadi. Tokenlar bo'lmasa tizim log/status saqlaydi, lekin tashqi yuborish amalga oshmaydi.
