# EDUKA Phase 3.9 — Force Tenant System Install

Sizdagi `{"ok":false,"error":"Not found"}` sababi:
- `/api/debug/tenant-center-v38` route serverga ulanmagan.
- Demak asosiy Railway start fayliga oldingi gate kirmagan yoki boshqa server fayl ishga tushyapti.

Bu fix:
- `phase39-tenant-system.js` qo‘shadi.
- `server.js`, `app.js`, `index.js`, `src/server.js`, `src/app.js`, `src/index.js` ichiga majburiy ulaydi.
- `real-crm-engine.js` ichiga ham backup install qo‘shadi.
- Yangi debug endpoint:
  `/api/debug/tenant-center-v39`

Patch qilingan fayllar:
- server.js
- backend/server.js
- _ONLY_UPLOAD_THIS_TO_BACKEND_REPO_ROOT/server.js
- real-crm-engine.js
- backend/real-crm-engine.js
- _ONLY_UPLOAD_THIS_TO_BACKEND_REPO_ROOT/real-crm-engine.js

Deploydan keyin test:
1. CEO’da bor subdomain:
   https://ilm-chashmalari.eduka.uz/api/debug/tenant-center-v39

To‘g‘ri natija:
   ok: true
   found: true
   version: phase39

2. Random subdomain:
   https://jffkkgfg.eduka.uz
To‘g‘ri natija:
   CRM ko‘rinmasin, faqat O‘quv markaz topilmadi chiqsin.

SQL:
- `PHASE39_FORCE_TENANT_SYSTEM.sql` ni DB’da run qiling.
