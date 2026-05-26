# Eduka 21.0 — Full System Stabilization

## Maqsad
Bu versiya yangi dizayn qo'shishdan ko'ra mavjud tizimdagi ishlamay qolgan tugma, forma, API va database bog'lanishlarini stabil qilishga qaratilgan.

## Qilingan ishlar
- Production'da `safeApi` fallback local/mock saqlashni ishlatmaydi.
- Drawer/form saqlashda API xato bo'lsa foydalanuvchiga aniq xato chiqadi.
- Finance bo'limidagi:
  - Qo'shimcha daromadlar
  - Ish haqi
  - Bonuslar
  - Xarajatlar
  real `/api/app/finance/transactions` API bilan bog'landi.
- Finance yozuvlari yuklanganda type/category bo'yicha bucketlarga ajratiladi.
- `data-open-modal` finance drawerlarini ochadigan qilindi.
- `/api/health`, `/health`, `/healthz` endpointlari qo'shildi.
- `schema.sql` va `migrate.js` ichiga 21.0 stability columns va indexlar qo'shildi.
- Students, Groups, Teachers CRUD payloadlari yangi fieldlar bilan moslashtirildi:
  - gender, father_name, mother_name, tags
  - teacher_salary, salary_type, chat_id, delivery_mode
  - teacher birth_date, gender, address, note
- Finance alias endpointlari qo'shildi:
  - `/api/app/finance/extra-incomes`
  - `/api/app/finance/salary`
  - `/api/app/finance/bonuses`
  - `/api/app/finance/expenses`

## Tekshiruv
- `node --check backend/server.js`
- `node --check backend/migrate.js`
- `node --check frontend/app.js`
- `node --check frontend/crm-services.js`
- `node --check frontend/student-app.js`

## Deploydan keyin
Railway deploy start komandasi migration bilan ishlaydi:
`npm run migrate && node backend/server.js`

Agar Railway healthcheck ishlatsa, path:
`/api/health`
