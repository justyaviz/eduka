# EDUKA Phase 3.7 — CEO Centers Open, Unknown Closed

Aniq xato:
- Oldingi fix CEO’dagi real markazlarni ham bloklab qo‘ydi.
- Sabab: `status='active'` va `created_by_ceo=true` kabi qattiq shartlar qo‘yilgan.
- CEO kartalarda esa status `Trial`, `Active`, `Suspended` bo‘lishi mumkin. Eski markazlarda `created_by_ceo` bo‘lmasligi mumkin.

Bu fix:
- CEO paneldagi organizations/centers jadvalida mavjud subdomainlar ochiladi.
- Random/yo‘q subdomainlar CRM HTML olmaydi.
- Status Trial/Active/Suspended bo‘lsa ham “topilmadi” bo‘lmaydi, chunki u CEO ro‘yxatda bor.
- Login keyingi qadamda tekshiriladi.
- Debug endpoint qo‘shildi:
  /api/debug/tenant-center

Test:
1. CEO’da bor:
   jun.eduka.uz
   ilm-chashmalari.eduka.uz
   rwrgwgrgrg.eduka.uz
   Natija: topilmadi emas, login yoki markaz holati chiqishi kerak.

2. CEO’da yo‘q:
   jffkkgfg.eduka.uz
   Natija: O‘quv markaz topilmadi. CRM menyulari ko‘rinmasin.

Agar CEO’da bor markaz hali ham ochilmasa:
- Shu URLni oching:
  https://SUBDOMAIN.eduka.uz/api/debug/tenant-center
- Natijani menga yuboring.
