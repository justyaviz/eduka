# Eduka 32.4.1 — Railway Runtime / Healthcheck Fix

## Nima tuzatildi

1. `npm start` endi migratsiyani kutmaydi.
   - Oldin: `node backend/migrate.js && node backend/server.js`
   - Endi: `node backend/server.js`
   - Sabab: Railway healthcheck server ochilishidan oldin migration tugashini kutib, timeout bo‘lishi mumkin edi.

2. Railway start command `npm run start:safe` qilindi.
   - `start:safe` serverni darhol ishga tushiradi.
   - Migration alohida `npm run migrate` orqali yuritiladi.

3. Server `0.0.0.0` hostiga bind qilindi.
   - Railway tashqi healthcheck app portiga kira olishi uchun majburiy.

4. `/api/health` endpoint yengillashtirildi.
   - DB bo‘lmasa ham 200 OK qaytaradi.
   - `GET` va `HEAD` so‘rovlarini qo‘llaydi.

5. Runtime loglar aniqlandi.
   - Server startda `Eduka backend is running on 0.0.0.0:PORT` deb yozadi.

## Railway deploy settings

Root Directory:

```txt
eduka
```

Build Command:

```bash
npm run build
```

Start Command:

```bash
npm run start:safe
```

Healthcheck Path:

```txt
/api/health
```

## Migration qanday ishlatiladi

Production database migration kerak bo‘lsa deploydan keyin Railway shell yoki local orqali:

```bash
npm run migrate
```

Agar migratsiyani start bilan birga yuritish kerak bo‘lsa:

```bash
npm run start:with-migrate
```

Lekin Railway’da healthcheck muammosi qaytmasligi uchun oddiy deployda `start:safe` tavsiya qilinadi.

## Test natijasi

Local production test:

```txt
PORT=4567 NODE_ENV=production npm start
/api/health — 200 OK
/ — 200 OK
```
