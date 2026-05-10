# Eduka 23.0.0 — Student App Pro

## Maqsad
Student App yangi darajaga olib chiqildi: Telegram bot orqali kirish va `student.eduka.uz` domenida login/parol orqali kirish birga ishlaydi.

## Asosiy yangiliklar
- 16-screen concept asosida premium mobile UI system.
- 2 xil access mode: Telegram Access va Domain Login.
- `student.eduka.uz` root route Student App shell ochadi.
- Domain Login: telefon/login + parol orqali Student App token yaratadi.
- Telegram Access: bot tokenli URL yoki Telegram WebApp initData orqali dashboard ochadi.
- Dashboard, Schedule, Payments, Attendance, Coin Wallet, Rewards Shop, My Rewards, Ranking, Achievements, Notifications, Materials, Homework/Tests, Profile sahifalari yangilandi.
- Fake status bar olib tashlangan.
- Mobile-first Telegram WebApp safe layout.
- Feature flags asosida menyu/quick action ko‘rinishi.

## Test URLlar
- `/app/home?v=2300`
- `https://student.eduka.uz/`
- Bot tokenli URL: `/app/open/TOKEN?v=2300`
