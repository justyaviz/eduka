EDUKA 21.4.4 GLOBAL ACTION MENU FIX

Muammo:
- 3 nuqta bosilganda dropdown ichidagi pastki amallar ko'rinmayapti.
- Jadval/card/modal overflow sabab menu kesilib qolmoqda.
- Ayrim sahifalarda faqat 'Ko'rish' chiqib, qolganlari pastda yashirinib qolmoqda.

Yechim:
- Menu endi jadval ichida emas, document.body ichida fixed holatda ochiladi.
- Shuning uchun u hech qayerda kesilmaydi.
- Uiverse uslubiga o'xshash dark gradient card style qo'shildi.
- Hamma sahifalardagi 3 nuqta tugmalariga global ishlaydi.

Qo'yish:
1) eduka/frontend/action-menu-fix.js ni Documents/GitHub/eduka/eduka/frontend/ ichiga tashlang.
2) eduka/frontend/action-menu-fix.css ni Documents/GitHub/eduka/eduka/frontend/ ichiga tashlang.
3) Documents/GitHub/eduka/eduka/frontend/app.html faylida <head> ichidagi app.css dan keyin qo'shing:

<link rel="stylesheet" href="/action-menu-fix.css?v=21.4.4" />

4) app.html pastida scriptlar joyida app.js/payment hotfixdan keyin qo'shing:

<script src="/action-menu-fix.js?v=21.4.4"></script>

Tavsiya qilingan final script tartibi:
<script src="/app.js?v=21.4.4"></script>
<script src="/payment-receipt-hotfix.js?v=21.4.3"></script>
<script src="/action-menu-fix.js?v=21.4.4"></script>

GitHub Desktop:
Summary: Fix global three-dot action menus
Commit to main
Push origin

Deploydan keyin:
Ctrl + Shift + R
