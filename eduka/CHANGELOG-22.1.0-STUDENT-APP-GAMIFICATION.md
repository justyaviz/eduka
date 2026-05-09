# Eduka 22.1.0 — Student App 22 + Gamification & Telegram Link

## Student App
- Student App UI 22.1 qayta yozildi: mobile-first, sodda, ishlaydigan ekranlar.
- Asosiy ekranlar: Splash, Login, Bosh sahifa, Jadval, To'lovlar, Davomat, Profil.
- Qo'shimcha ekranlar: Coinlar, Sovg'alar do'koni, Reyting, Yutuqlar, Bildirishnomalar, Materiallar.
- Keraksiz bo'sh tugmalar yashirildi; faqat real ishlaydigan bo'limlar qoldi.
- Bottom navigation: Bosh sahifa, Jadval, To'lov, Davomat, Profil.
- Coin balans va sovg'alar do'koni bosh sahifaga qo'shildi.

## Gamification
- `student_coin_transactions` jadvali qo'shildi.
- `student_reward_products` jadvali qo'shildi.
- `student_reward_redemptions` jadvali qo'shildi.
- `student_achievements` jadvali qo'shildi.
- O'qituvchi/admin coin berishi uchun API qo'shildi.
- Student coin evaziga sovg'a so'rovi yuborishi mumkin.
- Sovg'alar do'koni uchun default mahsulotlar seed qilinadi.

## Admin panel
- Student App menyusi soddalashtirildi.
- Gamification / Sovg'alar menyusi qo'shildi.
- Coin tarixi menyusi qo'shildi.
- Sovg'a so'rovlari menyusi qo'shildi.
- Materiallar menyusi qo'shildi.
- Eski bo'sh Student App bo'limlari menyudan olib tashlandi.

## Telegram bot
- `/start` bosgan va allaqachon ro'yxatdan o'tgan o'quvchi qayta ro'yxatdan o'tmaydi.
- Telegram ID / chat ID student profilida saqlanadi.
- QR receipt orqali `/start receipt_...` qilinganda chekdagi student Telegram profilga bog'lanadi.
- To'lov cheki bot orqali o'quvchiga yuboriladi.
- Coin berilganda Telegram xabar yuborish imkoniyati qo'shildi.

## Backend
- `/api/student-app/rewards/:id/redeem`
- `/api/student-app/profile`
- `/api/student-app/password`
- `/api/app/gamification/students/:id/coins`
- `/api/app/gamification/redemptions/:id/:action`
- Student App API resources kengaytirildi.

## Migration
- `backend/migrations/010_student_app_22_gamification.sql`
