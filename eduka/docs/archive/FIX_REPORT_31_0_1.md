# Fix Report — 31.0.1

## Sabab
Bir sahifada eski `app.html/app.js` layout’i va yangi Pro module JS/CSS’lari ketma-ket render bo‘layotgan edi. Browser avval eski HTML/CSS’ni ko‘rsatib, keyin Pro UI scriptlari DOM’ni yangilardi.

## Yechim
- Critical head script pro route’ni sahifa yuklanishidan oldin belgilaydi.
- `body.is-booting` vaqtida auth/app shell yashiriladi.
- Boot loader session check tugamaguncha yopilmaydi.
- Pro route’larda `pro-ui-ready` bo‘lmaguncha eski `.view`lar ko‘rinmaydi.
- Yangi Pro UI mount bo‘lgach yoki safe timeoutdan keyin UI ochiladi.
- Route change va history patch orqali keyingi navigatsiyada ham flicker qaytmaydi.

## Deploydan keyingi tavsiya
1. GitHub push → Railway redeploy.
2. Brauzerda `Ctrl + Shift + R`.
3. Agar eski cache kuchli qolgan bo‘lsa: Chrome DevTools → Application → Storage → Clear site data.
4. Test: `/admin/students`, `/admin/payments`, `/admin/attendance`, `/admin/operations`.
