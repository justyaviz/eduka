# EDUKA Phase 4.0 — Login Force Fix

Muammo:
- Login sahifa chiqyapti.
- Login/parol terilganda "Tekshirilmoqda..."da turib qolmoqda.
- Sabab: `/api/tenant/login` route javob bermayapti yoki eski route ishlayapti.

Bu fix:
- `/api/tenant/login` ni `phase39-tenant-system.js` ichiga majburiy qo‘shadi.
- Loginni `crm_tenant_admins` jadvalidan tekshiradi.
- Agar admin organizations ichida bo‘lsa, shundan ham tekshiradi.
- Frontendga 12 sekund timeout qo‘shadi, endi cheksiz "Tekshirilmoqda..." bo‘lib qolmaydi.
- Login muvaffaqiyatli bo‘lsa token yaratib CRM ochadi.

Patch qilingan fayllar:
- phase39-tenant-system.js
- backend/phase39-tenant-system.js
- _ONLY_UPLOAD_THIS_TO_BACKEND_REPO_ROOT/phase39-tenant-system.js
- public/app/app.js
- backend/public/app/app.js
- _ONLY_UPLOAD_THIS_TO_BACKEND_REPO_ROOT/public/app/app.js

Deploydan keyin:
1. SQL run qiling:
   PHASE40_TENANT_LOGIN_FORCE_FIX.sql

2. Test:
   https://ilm-chashmalari.eduka.uz/api/debug/tenant-center-v39
   ok/found true chiqsin.

3. Login qiling.
   Agar parol xato bo‘lsa, endi "Login yoki parol xato" chiqadi.
   Agar backend route ishlamasa, 12 sekunddan keyin aniq xabar chiqadi.
