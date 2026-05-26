# Eduka 32.2.0 — CEO Control Center Pro

## Maqsad
CEO/Admin panelidagi ko‘p tugmalar ishlamasligi, eski/new UI aralashishi va platforma boshqaruvi noqulayligi muammolarini yopish.

## Qilinganlar
- `ceo-console.html` tozalandi: eski `platform-26`, `platform-27-4`, `platform-29`, `ceo-billing-pro-25` scriptlari olib tashlandi.
- Bitta renderer: `ceo-control-center-32-2.js`.
- Bitta CSS design system: `ceo-control-center-32-2.css`.
- Dashboard, Centers, New Center, Plans, Features, Subscriptions, Billing, Invoices, Support, Admins, Audit, Settings va System Check sahifalari qayta yig‘ildi.
- Tugmalar real API endpointlarga ulandi.
- Modal/drawer/form submit flow qayta yozildi.
- Global search, refresh, logout, center plan, features, block/activate, reset password, invoice, payment, support va admin actions tozalandi.
- API ishlamasa sahifa sinmaydi, xato panelda ko‘rinadi.
- Mobile responsive CEO panel qo‘shildi.

## Test
- `node --check frontend/ceo-control-center-32-2.js`
- `npm run build`
