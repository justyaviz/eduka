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
