# Eduka 31.0.1 — No Flicker UI Loader Fix

## Muammo
Admin/CRM sahifalari ochilganda eski layout birinchi ko‘rinib, JS/CSS yuklangandan keyin yangi Pro UI’ga sakrab o‘tardi. Bu FOUC/layout flicker holatini keltirib chiqargan.

## Tuzatildi
- Boot loader endi app/session/route tayyor bo‘lmaguncha eski UI’ni ko‘rsatmaydi.
- Pro admin route’larda eski view yashiriladi va skeleton loader chiqadi.
- `/admin/students`, `/admin/teachers`, `/admin/groups`, `/admin/payments`, `/admin/attendance`, `/admin/operations`, `/admin/schedule` route’lari uchun route-ready guard qo‘shildi.
- `finishBoot()` faqat tayyor holatda body’ga `app-ready` beradi.
- Oldingi 650ms auto-hide o‘rniga xavfsiz 8s fallback qo‘yildi.
- Admin/CEO sahifalarida Student App service worker cache aralashmasligi uchun unregister guard qo‘shildi.
- CSS/JS cache busting versiyasi `31.0.1` qilindi.

## Yangi fayllar
- `frontend/eduka-no-flicker-31-0-1.css`
- `frontend/eduka-no-flicker-31-0-1.js`

## Tekshiruv
`npm run build` — 0 syntax error.
