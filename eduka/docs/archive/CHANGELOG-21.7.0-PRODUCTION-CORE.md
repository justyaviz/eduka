# Eduka 21.7.0 — Production Core Update

Bu versiya 15ta keyingi reja bo‘yicha production core poydevorini qo‘shadi.

## Qilingan ishlar

1. CRM versiya 21.7.0 ga yangilandi.
2. `app.html` asset cache versionlari 21.7.0 ga o‘tkazildi.
3. Health endpoint versiyasi 21.7.0 bo‘ldi.
4. `/api/dashboard/stats` va `/api/app/dashboard/stats` aliaslari qo‘shildi.
5. `/api/app/global-search?q=` endpointi qo‘shildi.
6. Global command palette qo‘shildi: `Ctrl + K`.
7. Dark mode toggle qo‘shildi.
8. Sidebar collapse/expand toggle qo‘shildi.
9. Mobile responsive UX qatlami qo‘shildi.
10. Sticky table header UX qatlami qo‘shildi.
11. Backend route module scaffold qo‘shildi.
12. Backend service module scaffold qo‘shildi.
13. Auth/permission/tenant middleware scaffold qo‘shildi.
14. DB pool module qo‘shildi.
15. Core migrations qo‘shildi: indexes, permissions, parent access, cashdesk.

## Muhim

`server.js` hali to‘liq modullarga bo‘lib tashlanmadi. 21.7.0’da modul struktura tayyorlandi va tekshiruvga qo‘shildi. Keyingi bosqichda monolit handlerlar birma-bir shu modullarga ko‘chiriladi.
