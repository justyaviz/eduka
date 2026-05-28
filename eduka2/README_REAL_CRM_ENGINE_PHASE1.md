# EDUKA Real CRM Engine Phase 1

Upload:
_ONLY_UPLOAD_THIS_TO_BACKEND_REPO_ROOT ichidagi fayllarni repo rootga tashlang.

Bu bosqichda haqiqiy ishlaydigan CRM motor qo'shildi:
- Postgres tablelar avtomatik yaratiladi
- Kurs, talaba, o'qituvchi, guruh, to'lov, xarajat, eslatma real saqlanadi
- Frontend drawer formalar backend APIga ulanadi
- Moliya real payment/expense summarydan ishlaydi
- Subdomain bo'yicha tenant ajratiladi

Deploydan keyin:
1. /api/app/health ochib tekshiring
2. /app/dashboard oching
3. Plus tugmasidan Kurs -> O'qituvchi -> Guruh -> Talaba -> To'lov qo'shib ko'ring
4. Ctrl+F5 qiling
