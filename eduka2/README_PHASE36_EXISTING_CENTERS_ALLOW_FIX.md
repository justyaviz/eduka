# EDUKA Phase 3.6 — Existing CEO Centers Allow Fix

Muammo:
- Phase 3.5 juda qattiq yopgan.
- Faqat organizations.created_by_ceo = TRUE bo‘lsa ochgan.
- Oldin CEO’da yaratilgan markazlarda bu ustun oldin bo‘lmagani uchun ular ham ochilmay qolgan.

Bu fix:
- Random yangi subdomain avtomatik yaratilmaydi.
- Database’da mavjud real o‘quv markazlar ochiladi.
- Mavjud markazni tanish belgisi:
  - organization mavjud
  - status active
  - deleted_at NULL
  - email yoki phone yoki owner_name yoki admin_password bor
- CEO panel orqali yangi yaratilgan markazlarda created_by_ceo TRUE bo‘ladi.

Qo‘shimcha endpoint:
POST /api/ceo/approve-existing-center
body: { "subdomain": "jun" }

Patch qilingan fayllar:
- hard-page-gate.js
- backend/hard-page-gate.js
- _ONLY_UPLOAD_THIS_TO_BACKEND_REPO_ROOT/hard-page-gate.js
- real-crm-engine.js
- backend/real-crm-engine.js
- _ONLY_UPLOAD_THIS_TO_BACKEND_REPO_ROOT/real-crm-engine.js

Deploydan keyin:
1. Avval SQL faylni database’da run qiling:
   PHASE36_EXISTING_CENTERS_ALLOW_FIX.sql

2. Keyin deploy qiling.

3. CEO’da bor markaz subdomainini oching:
   login chiqishi kerak.

4. Random mutlaqo yangi subdomain oching:
   O‘quv markaz topilmadi chiqishi kerak.
