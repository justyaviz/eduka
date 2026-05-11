# FIX REPORT — 27.4.0

## Qamrov
Bu build 27.1–27.4 bosqichlarni bitta stable patchga jamlaydi:
- Real Workflow Test & Fix
- Admin CRM Real Polish
- Finance Real Accounting
- CEO SaaS Monetization Final

## Muhim endpointlar
- `GET /api/workflow27/checklist`
- `POST /api/workflow27/run`
- `POST /api/workflow27/issues`
- `GET /api/app/admin-crm27/overview`
- `GET /api/app/admin-crm27/search?q=`
- `POST /api/app/admin-crm27/debts/recalculate`
- `GET /api/app/finance27/overview`
- `POST /api/app/finance27/cashbox/open`
- `POST /api/app/finance27/cashbox/entry`
- `POST /api/app/finance27/cashbox/close`
- `POST /api/app/finance27/payments/:id/cancel`
- `GET /api/super/monetization27/overview`
- `PUT /api/super/monetization27/centers/:id/plan`
- `POST /api/super/monetization27/centers/:id/block`
- `POST /api/super/monetization27/centers/:id/activate`
- `POST /api/super/monetization27/invoices`

## Railway hotfix
Agar table/column error chiqsa:
`backend/hotfix-27.4.0-workflow-admin-finance-ceo.sql`

## UI
`frontend/platform-27-4.css` va `frontend/platform-27-4.js` qo‘shildi.
