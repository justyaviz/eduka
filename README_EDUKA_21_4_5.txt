EDUKA 21.4.5 FINAL UI + THREE-DOT MENU + BUTTON + SEARCH FIX

Bu patch:
1) Hamma 3 nuqta menu/dropdownlarni ustida ochadi.
2) Oldingi ichida qolib ketadigan dropdownlarni bloklaydi.
3) Buttonlarni Eduka/JustYaviz brand stylega almashtiradi.
4) Qidiruv inputlarini professional search field ko'rinishiga o'tkazadi.
5) Menu z-index juda yuqori, modal/table/card ichida kesilmaydi.

QO'YISH:
1. ZIP ichidagi fayllarni Documents/GitHub/eduka/eduka/ ichiga tashlang:
   - frontend/premium-ui-actions.css
   - frontend/premium-ui-actions.js
   - apply-21-4-5-ui-patch.js

2. Documents/GitHub/eduka/eduka papkasida terminal oching va run qiling:
   node apply-21-4-5-ui-patch.js

Bu app.html ichiga kerakli CSS/JS ni avtomatik qo'shadi.

Agar qo'lda qo'shmoqchi bo'lsangiz:

HEAD ichiga:
<link rel="stylesheet" href="/premium-ui-actions.css?v=21.4.5" />

BODY oxiriga:
<script src="/premium-ui-actions.js?v=21.4.5"></script>

GitHub Desktop:
Summary: Final premium UI and global action menu fix
Commit to main
Push origin

Deploydan keyin:
Ctrl + Shift + R
