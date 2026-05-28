# EDUKA Healthcheck Safe V2

Bu versiyada Railway healthcheck muammosi tuzatildi.

Asosiy o'zgarish:
- /api/health har doim 200 qaytaradi.
- Database setup server ishga tushgandan keyin background'da ishlaydi.
- DATABASE_URL yoki Postgres vaqtincha xato bo'lsa ham deploy yiqilmaydi.
- /api/server-status orqali DB holatini ko'rasiz.
- /api/debug/init-db orqali DB setupni qo'lda ham ishga tushirish mumkin.

Login:
Email: ceo@eduka.uz
Parol: admin123

ENV:
DATABASE_URL=postgresql://...
NODE_ENV=production
JWT_SECRET=eduka_super_secret_change_this
CEO_EMAIL=ceo@eduka.uz
CEO_PASSWORD=admin123
CEO_NAME=EDUKA CEO

Railway:
Build Command: npm run build
Start Command: npm run start:safe
Healthcheck Path: /api/health
