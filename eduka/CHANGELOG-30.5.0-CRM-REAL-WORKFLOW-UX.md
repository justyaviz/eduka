# Eduka 30.5.0 — CRM Real Workflow & UX Final

## Qilinganlar
- `/admin/students`, `/admin/teachers`, `/admin/groups`, `/admin/payments`, `/admin/attendance`, dashboard sahifalariga CRM Pro UI layer singdirildi.
- Talaba profili kuchaytirildi: timeline, to'lov tarixi, davomat tarixi, guruhlar tarixi, Student App reset, Telegram status, qarzdorlik, arxiv action.
- Talabani guruhga biriktirish flow'i: group_students, payment plan, guruh narxi, balance recalculation.
- Qarzdorlik engine: guruh narxi, joined date, qisman/ortiqcha to'lov, bekor qilingan to'lovlarni hisobga olish poydevori.
- To'lov bekor qilish accounting: student balance qayta hisoblash, cashbox reverse entry, audit log.
- Professional chek/QR endpoint: thermal receipt, QR payload, admin/markaz/to'lov/qolgan qarzdorlik.
- Davomat UX: bugungi guruhlar, talabalar listi, bir bosishda status, hammasi keldi, saqlash.
- Search/filter/export: students/payments/debtors/attendance CSV, PDF uchun HTML report poydevori.
- Role/permission poydevori: crm_role_permissions.
- UI design system: card, table, drawer, toast-compatible action layer.

## Endpointlar
- `/api/app/crm305/students/:id/profile`
- `/api/app/crm305/students/:id/groups`
- `/api/app/crm305/students/:id/groups/:groupId`
- `/api/app/crm305/students/:id/archive`
- `/api/app/crm305/students/:id/restore`
- `/api/app/crm305/students/:id/app-reset`
- `/api/app/crm305/debt-engine/recalculate`
- `/api/app/crm305/payments/:id/receipt-pro`
- `/api/app/crm305/payments/:id/cancel`
- `/api/app/crm305/attendance/groups/:id/students`
- `/api/app/crm305/export`
- `/api/app/crm305/permissions`
