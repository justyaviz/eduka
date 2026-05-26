# EDUKA 2.0 — Modme-like compact layout fix

Bu versiyada landing sahifa Modme uslubiga yaqinlashtirildi:

- Container kengligi 1720px dan 1180px ga tushirildi.
- Header kengligi ixchamlashtirildi.
- Hero yozuvlari kichraytirildi va Modme kabi ikki chetdan joy qoldirildi.
- Hero CRM preview oynasi kichraytirildi.
- Button, nav, card, stats va mockup elementlari ixchamlashtirildi.
- SVG iconlar saqlandi, emoji ishlatilmaydi.
- Railway uchun `start:safe` va `/api/health` ishlaydi.

Railway:
- Root Directory: bo‘sh
- Build Command: `npm run build`
- Start Command: `npm run start:safe`
- Healthcheck Path: `/api/health`

Agar Railway root `backend` bo‘lsa:
- Root Directory: `backend`
- Build Command: `npm run build`
- Start Command: `npm run start:safe`
- Healthcheck Path: `/api/health`
