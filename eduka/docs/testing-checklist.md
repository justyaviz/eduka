# Eduka 20.0 Testing Checklist

## 1. Deploy
- [ ] Railway build xatosiz tugadi
- [ ] `npm run migrate` startdan oldin ishladi
- [ ] Backend logs ichida migration error yo'q
- [ ] Static fayllar `X-Eduka-Version: 20.0.0` qaytaryapti

## 2. Login
- [ ] Super Admin login ishlaydi
- [ ] Demo login ko'rinmaydi
- [ ] O'quv markaz admin login ishlaydi
- [ ] Noto'g'ri login/parolda aniq xato chiqadi

## 3. Super Admin
- [ ] Dashboard statistikasi chiqadi
- [ ] Yangi markaz yaratish ishlaydi
- [ ] Admin login/parol generatsiya bo'ladi
- [ ] Markaz block/unblock ishlaydi
- [ ] Tarif/obuna ko'rinadi
- [ ] Domain statuslari ko'rinadi

## 4. CRM Dashboard
- [ ] Loader chiqib keyin yopiladi
- [ ] Cardlar to'g'ri joylashgan
- [ ] Finance chart ko'rinadi
- [ ] Lead funnel ko'rinadi
- [ ] Activity feed ko'rinadi
- [ ] Dashboard mobileda buzilmaydi

## 5. Core CRM
- [ ] Talaba yaratish/tahrirlash/o'chirish
- [ ] Guruh yaratish/tahrirlash/o'chirish
- [ ] O'qituvchi yaratish/tahrirlash/o'chirish
- [ ] Kurs yaratish/tahrirlash/o'chirish
- [ ] To'lov qo'shish
- [ ] Qarzdorlik hisoblanadi
- [ ] Davomat saqlanadi
- [ ] Lead status o'zgaradi

## 6. Student App
- [ ] Demo ma'lumot chiqmaydi
- [ ] Real login talab qilinadi
- [ ] Dashboard real ma'lumot bilan ochiladi
- [ ] To'lovlar ko'rinadi
- [ ] Davomat ko'rinadi
- [ ] Imtihonlar ko'rinadi
- [ ] Uyga vazifalar ko'rinadi
- [ ] Empty state demo emas, professional matn bilan chiqadi

## 7. Cache
- [ ] Eski dizayn qaytmaydi
- [ ] CSS/JS `?v=20.0.0` bilan yuklanadi
- [ ] Hard refreshdan keyin ham yangi ko'rinish qoladi
