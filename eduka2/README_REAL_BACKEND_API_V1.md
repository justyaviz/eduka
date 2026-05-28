# EDUKA Real Backend API v1

Qo'shildi:
- Postgres schema migration
- JWT CEO login
- Real API routes
- Landing Demo form -> POST /api/demo-requests
- CEO panel -> API orqali ishlaydi
- Demo -> O'quv markazga aylantirish real Postgresda ishlaydi
- Telegram notification optional

## ENV
DATABASE_URL=postgresql://...
NODE_ENV=production
JWT_SECRET=eduka_super_secret_change_this
CEO_EMAIL=ceo@eduka.uz
CEO_PASSWORD=admin123
CEO_NAME=EDUKA CEO

Optional:
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

## Ishga tushirish
npm install
npm run db:setup

Alohida:
npm run db:migrate
npm run db:seed-ceo

## Railway
Root Directory: backend
Build Command: npm run build
Start Command: npm run start:safe
Healthcheck Path: /api/health

## Login
Email: ceo@eduka.uz
Parol: admin123
