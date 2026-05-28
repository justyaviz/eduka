# EDUKA Phase 3.8 — Slug Name Tenant Fix

Muammo:
- CEO panelda "ILM CHASHMALARI" bor.
- URL esa `ilm-chashmalari.eduka.uz`.
- Database’da subdomain ustuni bo‘sh bo‘lsa, gate faqat `name = ilm-chashmalari` deb qidirgan.
- Natijada topilmadi chiqgan.

Bu fix:
- `name` qiymatini slug qilib tekshiradi:
  ILM CHASHMALARI -> ilm-chashmalari
  JUN -> jun
- CEO’da bor markazlar ochiladi.
- CEO’da yo‘q random subdomainlar yopiq qoladi.

Deploydan keyin SQL run qilish tavsiya:
PHASE38_SLUG_NAME_TENANT_FIX.sql

Test:
https://ilm-chashmalari.eduka.uz/api/debug/tenant-center-v38

To‘g‘ri natija:
{
  "ok": true,
  "found": true,
  "record": { "name": "ILM CHASHMALARI", ... }
}

Keyin:
https://ilm-chashmalari.eduka.uz
login yoki markaz holati chiqadi.

Random:
https://jffkkgfg.eduka.uz
"O‘quv markaz topilmadi" chiqadi.
