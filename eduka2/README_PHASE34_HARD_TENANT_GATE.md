# EDUKA Phase 3.4 — Hard Tenant Gate

Aniqlangan xato:
- Oldingi versiyalarda har qanday subdomain avtomatik organization/tenant yaratib yuborishi mumkin edi.
- /api/app endpointlari login/tenant guard bilan to‘liq yopilmagan edi.
- Shuning uchun random subdomain ham CRM shell ochib yuboryapti.

Bu fix:
- Har qanday random subdomainni server darajasida bloklaydi.
- Faqat organizations.created_by_ceo = TRUE bo‘lgan subdomain ochiladi.
- CEO yaratmagan subdomain uchun CRM emas, “O‘quv markaz topilmadi” sahifasi chiqadi.
- /api/app ham tenant auth bilan yopildi.
- /api/tenant/status cache’siz tekshiriladi.

Test:
1. Random subdomain oching:
   https://jffkkgfg.eduka.uz
   Natija: O‘quv markaz topilmadi

2. CEO orqali markaz yarating:
   POST /api/ceo/create-center-admin

3. Yaratilgan subdomainni oching:
   Login chiqishi kerak.

4. Login/parol bilan kiring:
   Bo‘sh CRM ochiladi.

Muhim:
- Eski avtomatik yaratilgan tenantlar bloklanadi, chunki created_by_ceo = false.
- Real markazlarni CEO panel orqali qayta yaratish/tasdiqlash kerak.
