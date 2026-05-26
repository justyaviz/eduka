# Eduka 24.7.0 — Student App Full System Final

## Jamlangan bosqichlar
- 24.4.0 Security & Domain Pro
- 24.5.0 Admin Control foundation
- 24.6.0 Performance & Offline
- 24.7.0 Final QA & Bug Fix

## Asosiy yangiliklar
- `student.eduka.uz` domain login flow saqlandi va parol tiklash so'rovi qo'shildi.
- Telegram token login saqlandi, `/app/open/TOKEN` flow barqarorlashtirildi.
- Token refresh endpointi qo'shildi: `POST /api/student-app/auth/refresh`.
- Faol qurilmalar/sessiyalar endpointi qo'shildi: `GET /api/student-app/sessions`.
- Alohida sessiyani o'chirish endpointi qo'shildi: `POST /api/student-app/sessions/:id/revoke`.
- Logout mavjud tokenni revoke qiladi.
- Security sahifasida qurilmalar ro'yxati, token refresh, parol almashtirish va chiqish bor.
- Offline/online holat banneri qo'shildi.
- PWA manifest va service worker cache yangilandi.
- Student App CSS safe-area, mobile full-screen va interaction polish qoidalari kuchaytirildi.
- Migration/hotfix: `019_student_app_full_system_24_7_0.sql`.

## Test
`npm run build` — 0 syntax error.
