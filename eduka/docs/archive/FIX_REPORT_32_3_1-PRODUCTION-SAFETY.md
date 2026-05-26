# Eduka 32.3.1 — Production Safety Fix

Ushbu patch production deploydan oldin aniqlangan asosiy xavfsizlik va routing muammolarini tuzatadi.

## Tuzatildi

1. **Migration data reset xavfi yopildi**
   - `resetToOwnerOnly()` endi default ishlamaydi.
   - To‘liq data reset faqat `EDUKA_ALLOW_OWNER_RESET=1` bo‘lsa ishlaydi.

2. **Super Admin parol log’da chiqmaydi**
   - `Temporary password: ...` log’i olib tashlandi.
   - Production’da `owner`, `password`, `123456`, `change-me-before-production` kabi parollar bloklanadi.

3. **AI Assistant admin API himoyalandi**
   - `/api/app/ai-assistant/*` endi faqat platform admin/super admin session bilan ochiladi.

4. **AI Bot webhook boshqaruvi himoyalandi**
   - `/api/ai-bot/set-webhook` va `/api/ai-bot/webhook-info` endi auth talab qiladi.

5. **Telegram webhook secret tekshiruvi kuchaytirildi**
   - Secret sozlangan bo‘lsa, header majburiy va aniq mos bo‘lishi kerak.

6. **CRM 30.5 route serverga ulandi**
   - `/api/app/crm305/*` endpointlari endi `handleCrmWorkflow305()`ga ulanadi.

7. **Production error message xavfsizlandi**
   - Production’da ichki DB/error tafsilotlari userga qaytarilmaydi.

8. **Version markazlashtirildi**
   - `EDUKA_VERSION=32.3.1`
   - `/api/health` shu versionni qaytaradi.

9. **Package lock qo‘shildi**
   - `package-lock.json` dependency versiyalarini barqaror qiladi.

## Muhim deploy eslatma

Railway/Vercel/Server environment’da quyidagilarni albatta qo‘ying:

```env
NODE_ENV=production
DATABASE_URL=...
EDUKA_VERSION=32.3.1
EDUKA_ALLOW_OWNER_RESET=0
SUPER_ADMIN_EMAIL=...
SUPER_ADMIN_PASSWORD=KUCHLI_PAROL
STUDENT_APP_SESSION_SECRET=KUCHLI_RANDOM_SECRET
TELEGRAM_WEBHOOK_SECRET=KUCHLI_RANDOM_SECRET
```

Agar `SUPER_ADMIN_PASSWORD` kuchsiz bo‘lsa, production migration ataylab to‘xtaydi. Bu real data va admin panel xavfsizligi uchun.

## Tekshirildi

- `npm run build` — OK
- `npm run start:no-migrate` — OK
- `/api/health` — 200 OK, version `32.3.1`
- `/`, `/app`, `/student-app`, `/ceo/login`, `/ceo/dashboard` — 200 OK
- `/api/app/ai-assistant/overview` — authsiz 401 qaytaradi
- `/api/ai-bot/set-webhook` — authsiz 401 qaytaradi
- `/api/app/crm305/dashboard` — DATABASE_URL bo‘lmaganda xavfsiz 503 message qaytaradi
