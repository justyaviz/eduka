# Eduka 21.2.0 — Full Workflow Fix

This build activates the remaining high-priority workflows from the uploaded audit list.

## Fixed / activated
- Real notifications API and unread state.
- Student, group, teacher, course, lead create/update/delete actions now create notifications.
- Payment create/update/delete already recalculates debt; update now also notifies.
- Finance transaction create actions notify for income, salary, bonus, and expense.
- Student App password can be set directly with `/api/students/:id/app-password`.
- Drawer student password field now calls backend and enables Student App.
- Notification panel now reads real backend notifications first, with fallback cards.
- Workflow readiness endpoint added: `/api/app/workflow-readiness`.
- Uiverse-style notification color variants polished.

## Test checklist
1. Student App login: +998931949200 / 8888.
2. Create student with password field and open /app.
3. Create payment and print receipt.
4. Update payment and check debtor balance.
5. Create income/salary/bonus/expense.
6. Open notification panel and mark as read.
7. Create teacher, course, group, lead and verify notifications.
8. Export students/groups/teachers/payments/reports CSV.
