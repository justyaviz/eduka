# EDUKA 2.0 Landing — 0dan rebuild

Bu loyiha Eduka brendi uchun 0 dan yozilgan landing sahifa.

## Railway settings

Root Directory: bo‘sh qoldiring
Build Command: `npm run build`
Start Command: `npm run start:safe`
Healthcheck Path: `/api/health`

Agar service Root Directory `backend` bo‘lsa ham ishlaydi:
Root Directory: `backend`
Build Command: `npm run build`
Start Command: `npm run start:safe`
Healthcheck Path: `/api/health`

## Routes

- `/` yoki `/uz` — asosiy landing
- `/preview` — yaratilgan dizayn preview rasmlari
- `/api/health` — Railway healthcheck
