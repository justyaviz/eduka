# LC-UP Functional Audit For Eduka

Audit date: 2026-05-08

Scope: LC-UP panel was reviewed only for product architecture, UI flow, page structure, forms, tables, filters, drawers/modals, and button behavior. No code, logo, brand assets, colors, or proprietary materials were copied.

## Page Map

- Dashboard: KPI cards, year/month/center filters, finance chart, lead/student/payment/debt metrics, schedule shortcut.
- Leads: kanban columns, add lead, column/filter settings, Excel export, bulk SMS, SMS/delete/group/test/move/first lesson actions.
- Students: table with name, phone, groups, balance, teachers; search, phone, parent phone, group, course, teacher, tag and status filters; add/edit/delete/SMS/import/export.
- Groups: table with name, price, lesson time, course, teachers, days, progress, start date; add/edit/delete/export.
- Teachers: list with name, phone, salary type, birth date; add/edit/delete/SMS/export.
- Finance: payments, extra income, salary, bonuses, expenses, debts, cash.
- Settings: center info, general settings, office, learning, SMS, forms, tags, payment types, integrations, Student App, accounting.
- Reports: finance, courses, teacher performance, cash flow, salary, leads, removed students, attendance, points, exams, discounts, sent SMS, work time, journals, coins/crystals.
- Staff attendance: all/teachers/employees tabs, today filter, check-in/check-out.
- Archive: leads, students, teachers, employees, groups, finance children.
- Market: add-on module cards and install/remove actions.

## Route Map

- Dashboard: `/app/dashboard`
- Leads: `/app/leads`
- Students: `/app/students`, `/app/students/:id`
- Groups: `/app/groups`, `/app/groups/:id`, `/app/groups/:id/journal`
- Teachers: `/app/teachers`, `/app/teachers/:id`
- Finance: `/app/finance`, `/app/payments`, `/app/finance/extra-income`, `/app/finance/salary`, `/app/finance/bonuses`, `/app/finance/expenses`, `/app/debts`, `/app/finance/cash`
- Settings: `/app/settings/*` nested office, learning, sms, forms, integrations, student-app, accounting
- Reports: `/app/reports/*`
- Staff attendance: `/app/staff-attendance`
- Archive: `/app/archive/*`
- Market: `/app/market`

## Button And Action Matrix

- Add buttons open drawer/modal forms, validate required fields, save through API when available, and fall back to tenant-scoped local state.
- Edit buttons open existing data in drawer/modal.
- Delete buttons require confirmation and archive/delete safely.
- Export buttons show an export toast placeholder where a file endpoint is not available.
- SMS/Telegram buttons open/send a safe notification placeholder.
- Payment and debt actions open payment drawer or reminder placeholder.
- Schedule, journal, staff attendance, Student App buttons provide visible UI feedback and no silent clicks.

## Form Field Matrix

- Student: full name, phone, parent phone, birth date, gender, address, course, group, teacher, payment type, discount, tags, status, note.
- Group: name, course, teacher, room, price, start/end time, lesson days, start date, status, note.
- Teacher: full name, phone, email, course/subjects, groups, login toggle, salary type/value, status.
- Payment: student, group, month, due amount, paid amount, discount, method, date, note.
- Settings resources: name/title, status/active toggle, date range where relevant, save action.

## Implementation Task List

- Add `/api/app/*` aliases without breaking existing `/api/*`.
- Add safe DB columns/tables for archive, rooms, payment types, finance transactions, staff attendance, schedule lessons, tags, settings.
- Expand Eduka route aliases so requested CRM URLs do not fall to dashboard/404.
- Keep Eduka design and terminology independent from LC-UP branding.
- Upgrade Student App to 12 premium mobile screens with working navigation and safe actions.
