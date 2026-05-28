# EDUKA Real CRM Engine — Phase 1

Bu versiya haqiqiy ishlaydigan CRMning birinchi bosqichi.

Qo'shildi:
- Postgres schema avtomatik yaratiladi
- Real API:
  - /api/app/init
  - /api/app/dashboard
  - /api/app/courses
  - /api/app/students
  - /api/app/teachers
  - /api/app/groups
  - /api/app/group-students
  - /api/app/payments
  - /api/app/expenses
  - /api/app/finance/summary
  - /api/app/debtors
  - /api/app/attendance
  - /api/app/reminders
- Tenant/subdomain ajratish: markaz.eduka.uz => tenant=markaz
- Student/teacher/group/course/payment/expense/reminder saqlanadi
- To'lov qabul qilinsa student balance oshadi
- Moliya summary real payment va expense orqali hisoblanadi
- Qarzdorlar kurs narxi va to'langan summadan hisoblanadi
- Frontend drawer formalar APIga ulanadi

Tekshirish:
1. Deploy qiling
2. https://your-domain/api/app/health oching
3. https://your-domain/api/app/init POST ishlaydi
4. /app/dashboard ga kiring
5. Quick plus orqali kurs/o'qituvchi/guruh/talaba/to'lov qo'shing

Agar server file avtomatik patch bo'lmasa:
server.js yoki index.js ichida qo'shing:
const { installRealCrmEngine } = require('./real-crm-engine');
installRealCrmEngine(app);
app.listen(...) dan oldin.
