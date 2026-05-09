# Eduka Student App 21.0 — Cambridge Glass UI + Demo Student

## Dizayn yo'nalishi
Berilgan referens rasmlar asosida Student App yangi 21.0 UI uslubiga o'tkazildi:
- iOS-style glassmorphism ekran
- oq/kulrang transparent background
- yumaloq kartalar
- ko'k asosiy aksent
- pastki 5 tab: Main, Progress, Today, Chat, Profile
- coin/point/streak/leaderboard bloklari
- service grid
- product shop
- progress score
- today task + coin reward
- chat ro'yxati va chat room
- library level cards

## Test login
Student App test/demo o'quvchisi migration orqali yaratiladi:

- Telefon: `+998931949200`
- Parol: `8888`
- Center/subdomain: `aloo-academy`
- Student name: `Harvey Specter`
- Course: `Pre-Intermediate`
- Group: `Elementary 10:30`
- Coins: `3700`
- Points/Crystals: `245000`

## Coin tizimi
- Today sahifasida task reward bosilganda coin va point qo'shiladi.
- Product shop coin balansni tekshiradi.
- Yetarli coin bo'lmasa xato chiqaradi.
- Local demo interaktiv holati `localStorage`da saqlanadi.
- Real backendda student `coins` va `crystals` fieldlari ishlatiladi.

## Backend / Migration
- `migrate.js` ichiga `seedStudentApp21Demo()` qo'shildi.
- Student App default modullari yangilandi:
  - Explore Library
  - Support Teacher
  - Cambridge Translator
  - IELTS Mock Club
  - IDP IELTS Exam
  - University Support
  - Letter Request
  - Mid & Final Exams
  - Cambridge Events

## Tekshiruv
`npm run build` xatosiz o'tdi.
