# Eduka 2.0 — Final Clean UI Rebuild

Eduka 2.0 brandbook ranglariga mos, 0 dan qayta yig‘ilgan SaaS/CRM preview platforma.

## Routes

- `/` — Landing page
- `/ceo` — CEO Dashboard
- `/ceo/centers` — Markazlar va Tariflar
- `/ceo/billing` — Platform Analytics & Billing
- `/admin` — O‘quv Markaz Dashboard
- `/admin/students` — O‘quvchilar Moduli
- `/admin/finance` — To‘lovlar va Moliya
- `/admin/attendance` — Davomat va Jadval
- `/teacher` — O‘qituvchi Paneli
- `/student-app` — Student App
- `/login` — Login Preview
- `/preview` — 10 sahifa preview
- `/api/health` — Railway healthcheck

## Railway

Root Directory: project root
Build Command: `npm run build`
Start Command: `npm run start:safe`
Healthcheck Path: `/api/health`

## Local

```bash
npm install
npm run build
npm start
```

Open: `http://localhost:3000`
