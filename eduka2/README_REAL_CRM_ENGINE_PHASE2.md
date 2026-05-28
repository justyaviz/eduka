# EDUKA Real CRM Engine Phase 2

Bu bosqichda Modme uslubidagi ichki workflowlar qo‘shildi:

## Qo‘shildi
- Sozlamalar > Kurslar real CRUD
- Sozlamalar > Xonalar real CRUD
- O‘qituvchi qo‘shish kengaytirildi: telefon, ism, tug‘ilgan sana, jins, fan, parol
- Guruh yaratish: kurs + o‘qituvchi + xona + kunlar + vaqt + boshlanish/tugash sanalari
- Guruh ustiga bosilganda detail sahifa ochiladi
- Guruh detailda:
  - kurs
  - o‘qituvchi
  - narx
  - vaqt
  - xona
  - xona sig‘imi
  - mashg‘ulot sanalari
  - talabalar ro‘yxati
- Guruhga talaba qo‘shish modal orqali ishlaydi
- Guruhdan talaba chiqarish ishlaydi
- Backend API endpointlar:
  - /api/app/rooms
  - /api/app/courses-v2
  - /api/app/teachers-v2
  - /api/app/groups-v2
  - /api/app/groups-v2/:id
  - /api/app/groups-v2/:id/students

## Test ketma-ketligi
1. Sozlamalar > Kurslar > kurs qo‘shing
2. Sozlamalar > Xonalar > xona qo‘shing
3. O‘qituvchilar > o‘qituvchi qo‘shing
4. Guruhlar > guruh qo‘shing
5. Guruh row ustiga bosing
6. Guruh ichida + tugmasi bilan talaba biriktiring

Deploydan keyin Ctrl+F5 qiling.
