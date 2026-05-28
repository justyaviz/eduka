# EDUKA Phase 3.2 — Tenant Login + Subdomain Isolation Fix

Muammo:
- Demo so‘rovdan subdomain yaratilgan, lekin subdomain ochilganda login emas dashboard chiqyapti.
- Dashboard 0 chiqyapti va Not found toast ko‘rinmoqda.
- Sabab: tenant login/session guard va tenant admin user ulanishi to‘liq emas.

Qo‘shildi:
- /api/tenant/status
- /api/tenant/login
- /api/tenant/logout
- /api/ceo/create-center-admin
- crm_tenant_admins table
- crm_sessions table
- Subdomain bo‘yicha tenant aniqlash
- Login qilmaguncha dashboardni bloklash
- Har bir subdomain uchun alohida token/session

Deploydan keyin test:
1. jun.eduka.uz oching
2. Login ekran chiqishi kerak
3. Telegramdagi login/parol bilan kiring
4. CRM dashboard ochiladi
5. /api/tenant/status ochib tekshiring

Agar login ishlamasa:
- /api/ceo/create-center-admin orqali admin yaratish kerak bo‘ladi.
