# Eduka 21.1.0 Payment & Receipt Fix

## Fixed
- Payment creation now saves paid_amount/payment_date and returns receipt number.
- Payment receipt endpoint added: `/api/payments/:id/receipt`.
- Receipt settings endpoint added: `/api/app/receipt-settings`.
- Receipt settings UI is now a real form.
- Payment rows include a Chek button.
- Payment drawer can automatically print receipt after saving.
- Default payment types are auto-created.
- Finance aliases now use dedicated endpoints for extra income, salary, bonuses and expenses.
- Payment creation creates notifications and audit logs.

## Railway
Run migrations normally with `npm start`.
