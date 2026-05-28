# EDUKA Phase 3.5 — No CRM for Unknown Subdomains

Muammo:
- Random subdomainlarda API Not found deyapti, lekin CRM shell baribir ko‘rinyapti.
- Sabab: HTML/app fallback tenant tekshiruvdan oldin ishlayapti.

Bu fix:
- hard-page-gate.js qo‘shadi
- server.js/app.js/index.js ichida gate app yaratilgandan keyin darhol ishga tushadi
- spa-fallback-fix.js ham alohida himoya qiladi
- unknown subdomain uchun index.html umuman berilmaydi
- frontend ham fail-closed: tenant tasdiqlanmaguncha body yashirin turadi

Patch qilingan fayllar:
- server.js
- backend/server.js
- _ONLY_UPLOAD_THIS_TO_BACKEND_REPO_ROOT/server.js
- spa-fallback-fix.js
- backend/spa-fallback-fix.js
- _ONLY_UPLOAD_THIS_TO_BACKEND_REPO_ROOT/spa-fallback-fix.js

Test:
1. Random subdomain oching:
   https://jffkkgfg.eduka.uz

To‘g‘ri natija:
- CRM menyu ko‘rinmaydi
- faqat “O‘quv markaz topilmadi” sahifasi chiqadi

2. CEO yaratgan subdomain:
- login sahifa chiqadi
- login qilsa bo‘sh CRM ochiladi

Muhim:
Railway start qilayotgan fayl ichida `installPhase35HardPageGate(app);` bo‘lishi shart.
