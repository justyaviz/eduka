# Eduka Landing

Eduka.uz uchun landing page: o'quv markazlar uchun CRM platforma taqdimoti.

## Ishga tushirish

```bash
npm start
```

Server `PORT` environment variable orqali port oladi. Lokal holatda default port: `3000`.

## Railway

Railway GitHub repository ulanganidan keyin `npm start` orqali ishga tushadi.

Custom domain uchun Railway service ichida `Settings -> Public Networking -> Custom Domain`
qismidan `eduka.uz` domeni qo'shiladi va Railway bergan DNS yozuvlari domen provayderida sozlanadi.

## Telegram demo form

Railway service variables qismiga quyidagilar qo'shiladi:

```txt
TELEGRAM_BOT_TOKEN=bot token
TELEGRAM_CHAT_ID=guruh yoki kanal id
```

Demo formasi `/api/demo` endpoint orqali Telegram guruhga yuboriladi.
