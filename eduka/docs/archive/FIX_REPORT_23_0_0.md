# Fix Report 23.0.0

- Student App UI to‘liq qayta yozildi.
- Student App endi ikki xil kirish usulini ko‘rsatadi:
  1. Telegram bot orqali tasdiqlash.
  2. student.eduka.uz orqali login/parol.
- Server host routing `student.eduka.uz` uchun Student App shell qaytaradigan qilib o‘zgartirildi.
- JS tokenni `/app/open/:token`, `?token=`, localStorage va Telegram WebApp initData orqali tekshiradi.
- Domain login `/api/student-app/auth/password` bilan ishlaydi.
