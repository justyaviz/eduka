
EDUKA 21.4.3 PAYMENT HOTFIX

1) Copy this file:
   eduka/frontend/payment-receipt-hotfix.js
   to:
   Documents/GitHub/eduka/eduka/frontend/payment-receipt-hotfix.js

2) Open:
   Documents/GitHub/eduka/eduka/frontend/app.html

3) Find this line near the bottom:
   <script src="/app.js?v=21.4.2"></script>

4) Directly AFTER it paste:
   <script src="/payment-receipt-hotfix.js?v=21.4.3"></script>

5) Optional but recommended: change app.js version to:
   <script src="/app.js?v=21.4.3"></script>

6) GitHub Desktop:
   Summary: Fix payment submit auto amount and receipt print
   Commit to main
   Push origin

7) Railway deploy tugagach:
   Ctrl + Shift + R

What this hotfix does:
- Payment modal freezing fix
- Student/group/course data auto loading
- Group/course price auto-fills payable amount
- Payment form submit is intercepted and sent directly to /api/payments
- After successful payment, thermal receipt opens automatically
- Receipt window calls window.print() automatically, so Enter can print
