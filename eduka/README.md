# Eduka

Eduka.uz uchun landing frontend va Node backend. Hozir frontend landing sahifa, backend esa static fayllar va demo arizalarni Telegramga yuboradigan API vazifasini bajaradi.

## Tuzilma

```txt
frontend/  landing page, assets, legal sahifalar
backend/   Node.js server va API endpointlar
```

## Ishga tushirish

```bash
npm start
```

Server `backend/server.js` orqali ishga tushadi va `frontend/` papkasini static qilib beradi. `PORT` environment variable orqali port oladi. Lokal holatda default port: `3000`.

## Railway

Railway GitHub repository ulanganidan keyin root directory `eduka` bo'lib qoladi va `npm start` orqali ishga tushadi.

Custom domain uchun Railway service ichida `Settings -> Public Networking -> Custom Domain`
qismidan `eduka.uz` domeni qo'shiladi va Railway bergan DNS yozuvlari domen provayderida sozlanadi.

## Telegram botlar

Railway service variables qismiga quyidagilar qo'shiladi:

```txt
DATABASE_URL=postgres connection string
BASE_DOMAIN=eduka.uz

LANDING_BOT_TOKEN=landing ariza bot tokeni
LANDING_CHAT_ID=guruh yoki kanal id

STUDENT_BOT_TOKEN=@edukauz_bot tokeni
STUDENT_WEBAPP_URL=https://eduka.uz/student-app
STUDENT_APP_SESSION_SECRET=uzun random secret
TELEGRAM_WEBHOOK_SECRET=uzun random secret
```

Landing demo formasi `/api/demo` endpoint orqali faqat `LANDING_BOT_TOKEN` va
`LANDING_CHAT_ID` bilan Telegram guruhga yuboriladi. Bu bot `/start` yoki Student
App login oqimida ishlatilmaydi.

Student App bot faqat `STUDENT_BOT_TOKEN` bilan ishlaydi. Eski deploymentlar uchun
fallback mavjud: `STUDENT_BOT_TOKEN || BOT_TOKEN`, `STUDENT_WEBAPP_URL || WEBAPP_URL`,
`LANDING_BOT_TOKEN || TELEGRAM_BOT_TOKEN`, `LANDING_CHAT_ID || TELEGRAM_CHAT_ID`.
Yangi production sozlamalarda yuqoridagi yangi nomlardan foydalaning.

Student bot webhook:

```txt
https://api.telegram.org/bot<STUDENT_BOT_TOKEN>/setWebhook?url=https://eduka.uz/api/telegram/webhook
```

Webhook secret ishlatilsa:

```txt
https://api.telegram.org/bot<STUDENT_BOT_TOKEN>/setWebhook?url=https://eduka.uz/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

`TELEGRAM_WEBHOOK_SECRET` sozlangan bo'lsa, Telegram webhook ham aynan shu
`secret_token` bilan qayta set qilinishi kerak. Secret header kelmasa backend
ordinary webhook fallback sifatida update'ni qabul qiladi va logda ogohlantiradi;
noto'g'ri secret header kelsa update bajarilmaydi, lekin Telegram retry loop
bo'lmasligi uchun 200 qaytariladi.

Safe debug endpointlar token qiymatini qaytarmaydi:

```txt
GET /api/telegram/status
GET /api/telegram/student-bot-info
GET /api/telegram/landing-bot-info
GET /api/telegram/webhook-info
POST /api/telegram/test-landing-message
GET /api/telegram/test-student-message?chat_id=<telegram_chat_id>
```

Landing test endpointi `LANDING_BOT_TOKEN` bilan `LANDING_CHAT_ID` ga test xabar
yuboradi. Student test endpoint production'da `TELEGRAM_WEBHOOK_SECRET` ni
`x-telegram-webhook-secret` headerida yoki `secret` query parametrida talab qiladi.

## PostgreSQL login

CRM kabinet haqiqiy login uchun `DATABASE_URL` environment variable talab qiladi.

1. PostgreSQL bazada schema yarating:

```bash
psql "$DATABASE_URL" -f backend/schema.sql
```

2. Admin user uchun SQL generatsiya qiling:

```bash
node backend/create-admin.js "Admin Ism" "+998901234567" "KuchliParol123!" "ilm academy uz"
```

3. Chiqqan SQL'ni PostgreSQL bazada ishga tushiring.

Login endpointlari:

```txt
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
GET  /api/app/summary
```
