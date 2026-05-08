# Eduka 19.6 — Super Admin Stabilization + Real Center Creation + Student App No-Demo Fix

## Qilingan ishlar

- `backend/migrate.js` qo‘shildi: schema, unique indexes, platform owner seed.
- Yangi markaz yaratish uchun kerakli `UNIQUE INDEX` va dedupe migration qo‘shildi.
- Super Admin admin-users API qo‘shildi:
  - `GET /api/super/admin-users`
  - `POST /api/super/admin-users`
  - `PUT /api/super/admin-users/:id`
  - `DELETE /api/super/admin-users/:id`
  - `POST /api/super/admin-users/:id/reset-password`
- Yangi markaz wizard kuchaytirildi: auto-password, settings, default roles/permissions, invoice, feature flags.
- Student App demo fallback o‘chirildi: API bo‘lmasa demo emas, empty state chiqadi.
- CRM mock fallback faqat localhost dev rejimida ishlaydi.
- Build script `migrate.js` ni ham tekshiradi.

## Railway’da majburiy birinchi command

```bash
npm run migrate
```

Keyin deploy/restart qiling.

## Super Admin

Default:

```text
admin@eduka.uz
12345678
```

Env orqali almashtirish mumkin:

```text
SUPER_ADMIN_EMAIL
SUPER_ADMIN_PASSWORD
SUPER_ADMIN_PHONE
```

## Test checklist

1. Super Admin login.
2. Admin users yaratish va reset password.
3. Yangi markaz yaratish.
4. Yangi markaz admin login/parol bilan kirish.
5. Student App demo data chiqmasligi.
6. Dashboard real API bilan ochilishi.
7. Tarif/feature flags yozilishi.
8. Domain/subdomain record yaratilishi.
