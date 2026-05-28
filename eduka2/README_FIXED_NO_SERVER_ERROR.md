# EDUKA Fixed No Server Error Build

Bu zipda CEO login server error muammosi uchun self-setup qo'shildi.

Nima tuzatildi:
- Server start bo'lganda Postgres schema avtomatik yaratiladi.
- CEO user avtomatik yaratiladi.
- /api/ceo/login aniq realError qaytaradi.
- /api/debug/db DB ulanishni tekshiradi.
- /api/debug/init-db DB setupni qo'lda ishga tushiradi.
- railway.json oddiy start:safe bilan qoladi.
- db:setup shart emas, lekin bor.

ENV kerak:
DATABASE_URL=postgresql://...
NODE_ENV=production
JWT_SECRET=eduka_super_secret_change_this
CEO_EMAIL=ceo@eduka.uz
CEO_PASSWORD=admin123
CEO_NAME=EDUKA CEO

Optional:
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

Railway:
Root Directory: backend yoki service qaysi rootdan ishlayotgan bo'lsa o'sha.
Build Command: npm run build
Start Command: npm run start:safe
Healthcheck Path: /api/health

Tekshir:
1. /api/health
2. /api/debug/db
3. /api/debug/init-db
4. /ceo/login

Login:
Email: ceo@eduka.uz
Parol: admin123
