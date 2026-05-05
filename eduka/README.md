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

## Telegram demo form

Railway service variables qismiga quyidagilar qo'shiladi:

```txt
TELEGRAM_BOT_TOKEN=bot token
TELEGRAM_CHAT_ID=guruh yoki kanal id
```

Demo formasi `/api/demo` endpoint orqali Telegram guruhga yuboriladi.

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
