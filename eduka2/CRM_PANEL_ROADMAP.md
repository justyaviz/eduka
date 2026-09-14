# EDUKA — O‘quv markaz Admin/CRM Panel Roadmap

Status: v0.0 audit started on `crm/v0.0-audit`.

## STRICT SCOPE LOCK

This roadmap is ONLY for the client-facing tenant admin/CRM panel served from subdomains such as `markaz.eduka.uz` and `/app/*`.

DO NOT TOUCH:
- public landing page `/`
- `/prices`
- `/gamification`
- `/vacancies`
- public marketing header/footer/assets
- CEO panel unless a tenant-admin feature explicitly requires a backend contract change

Primary frontend scope:
- `public/app.html`
- `public/app/app.js`
- `public/app/app.css`

Primary backend scope when needed:
- `routes/center-api.js`
- tenant auth/middleware
- non-destructive tenant-scoped migrations only

---

## v0.0 — Audit, freeze, inventory

Goals:
- Freeze the current working CRUD/auth baseline.
- Inventory every visible button, menu, tab, filter, dropdown, drawer, popup and route.
- Classify each item: `WORKING`, `PARTIAL`, `DEAD`, `PLACEHOLDER`, `HIDDEN-BUT-BACKEND-READY`.
- Map frontend features against actual `/api/app/*` endpoints.
- Record responsive and interaction problems before redesign.
- Keep current tenant isolation and working CRUD untouched.

Known v0.0 findings:
- Sidebar and login use a generic arrow icon instead of a real EDUKA/center logo.
- Several topbar controls are visible but have no implemented action.
- Language popup opens, but languages are not actually switched.
- Global search input has no search behavior.
- License `Batafsil` and `To‘lash` buttons have no real flow.
- Footer `Texnik yordam` and `Video darsliklar` are visual labels, not real actions.
- Floating calendar button has no implemented behavior.
- Quick-add, language and profile popups do not have a unified outside-click/Escape close manager.
- Drawer closes by X/backdrop but needs Escape, focus restore and unsaved-change handling.
- Dashboard contains hardcoded zero metrics and a large empty placeholder.
- Dashboard schedule tabs are visual only.
- Student filters are visual only; backend search exists but UI does not use it.
- Students can be created and paid for, but edit/delete/profile/detail flows are missing from the UI despite backend update/delete support.
- Group row opens detail, but the three-dot action control has no action menu.
- Group detail has several dead circular buttons and mostly dead detail tabs.
- Group detail labels the student list as `Davomat`, but it is not a real attendance-taking UI.
- Finance UI uses hardcoded May 2026 date labels and does not expose expenses even though backend supports expenses.
- Reminders are loaded and can be created, but the page does not render actual reminder cards/list/statuses.
- Settings has many menu items whose content is only `keyingi bosqichda ulanadi`.
- Leads and Attendance backends exist, but frontend pages are placeholders/hidden.
- Reports/Rating/Teacher attendance are placeholders without complete backend/UI contracts.
- No consistent loading/skeleton/error/empty-state system.
- No notification center despite a bell button.
- No professional center branding/profile configuration.
- Mobile/tablet admin UX is not production-quality.
- Motion is limited to loader/basic fade; drawers, menus, page transitions and cards lack a coherent motion system.

Exit criteria:
- Every visible interaction has an owner/status.
- No unknown dead button remains undocumented.
- A stable regression checklist exists for the currently working CRUD/auth flows.

---

## v0.1 — Admin shell, identity, logo, navigation

Goals:
- Replace generic arrow logo with a professional EDUKA tenant shell identity.
- Add center avatar/logo slot and center name/subdomain context.
- Professional sidebar hierarchy with clear active state and tooltips.
- Topbar cleanup: breadcrumb/page title, center context, user menu, notifications, help.
- Remove or hide controls that are not implemented yet.
- Add one unified popup/menu manager: only one menu open at a time, outside-click closes, Escape closes.
- Add proper drawer focus management.

Deliverables:
- Real logo treatment.
- Center logo fallback initials.
- Clean sidebar + topbar visual system.
- Working profile dropdown.
- Working fullscreen button or remove it until implemented.
- Working help destination or remove it until implemented.
- Remove fake clock control if it has no product purpose.

Exit criteria:
- No decorative/dead control in the persistent shell.
- Shell feels like a real education-center admin product.

---

## v0.2 — Dashboard 2.0

Goals:
- Replace placeholder dashboard with real operational overview.
- Use real API stats only.
- Build compact KPI cards for students, groups, monthly income, leads, attendance, debtors when supported.
- Recent activity feed from `/api/app/activity`.
- Today schedule block based on groups/schedule data.
- Quick actions that actually work.
- Upcoming reminders and recent payments.

Backend/API work:
- Extend dashboard endpoint only for metrics that can be calculated reliably.
- Do not show fake zero metrics for unsupported concepts.

Exit criteria:
- Dashboard has no generic `Ko‘rsatiladigan ma'lumotlar yo‘q` block when useful tenant data exists.
- Every number is traceable to tenant DB data.

---

## v0.3 — Students 2.0

Goals:
- Real search wired to backend query.
- Status/group/financial filters.
- Student detail/profile drawer or page.
- Edit student.
- Soft-delete student with professional confirm dialog.
- Parent phone, notes, birth date, gender and group memberships.
- Payment history per student.
- Balance/debt state with clear visual badges.
- Multi-group support in UI.

Exit criteria:
- Full CRUD is possible from UI.
- Search/filter/edit/delete survive refresh.

---

## v0.4 — Teachers, Courses, Rooms, Groups

Teachers:
- Professional teacher cards/table.
- Edit/delete with validation.
- Group assignments and workload count.
- Salary field if actively supported.

Courses/Rooms:
- Full CRUD.
- Delete/archive flows.
- Course price/duration/lesson duration.
- Room capacity and occupancy awareness.

Groups:
- Real action menu for three-dot button.
- Edit/archive/delete group.
- Attach/remove students.
- Group capacity indicator.
- Schedule and teacher/course/room summary.
- Group detail tabs implemented only when real.

Exit criteria:
- No dead buttons in these four core modules.

---

## v0.5 — Attendance + Reminders

Attendance:
- Activate existing `/api/app/attendance` backend in UI.
- Select date/group.
- Mark present/absent/late/excused.
- Save in one click.
- Group detail attendance tab becomes real.
- Daily attendance summary on dashboard.

Reminders:
- Render real reminder list/cards.
- Overdue/today/upcoming sections from real dates.
- Complete/create/edit/archive where backend supports it.
- Quick add reminder from global action.

Exit criteria:
- Attendance can be taken for a real group and persists after refresh.
- Reminder counts are real, not hardcoded zero.

---

## v0.6 — Finance 2.0

Goals:
- Remove hardcoded date range.
- Date-range filters.
- Income, expenses, net profit.
- Use existing `/api/app/expenses` endpoints.
- Add expense creation flow.
- Payment method filters.
- Student/group filtering.
- Transaction detail and printable receipt foundation.
- Export CSV/XLSX later only after the table/filter contract is stable.

Exit criteria:
- All finance summary values match stored tenant transactions.
- No fake dates or fake balances.

---

## v0.7 — Leads / mini-CRM

Goals:
- Activate existing `/api/app/leads` backend.
- Pipeline columns/statuses.
- Create/edit lead.
- Source, phone, note, status.
- Convert lead into student using an explicit safe flow.
- Search/filter pipeline.

Exit criteria:
- Lead CRUD works and persists.
- Conversion does not duplicate or leak tenant data.

---

## v0.8 — Settings, center customization, account

Goals:
- Keep only settings that are real.
- General center settings.
- Center logo upload/branding when backend contract is ready.
- User/account profile.
- Login/security settings.
- Payment methods configuration only if it affects product behavior.
- Billing/license details with actual plan/status/expiry.
- Hide unfinished integrations/exam/receipt/SMS settings or clearly mark them `Tez kunda` without fake controls.

Exit criteria:
- No settings page says only `keyingi bosqichda ulanadi` while looking interactive.

---

## v0.9 — UX system, responsive, animation, accessibility

Goals:
- Responsive desktop/tablet/mobile admin shell.
- Collapsible sidebar.
- Tables become usable on narrow screens.
- Unified drawer/modal/dropdown motion.
- Page transition and skeleton loading.
- Hover/press/focus micro-interactions.
- Reduced-motion support.
- Keyboard navigation and focus states.
- Consistent toast/error/confirm/empty states.
- Prevent double submit on all save actions.

Exit criteria:
- 360, 390, 768, 1024, 1366, 1440 widths pass.
- No menu/drawer remains stuck open.
- No visible control lacks feedback.

---

## v1.0 — Client-ready release

Goals:
- End-to-end tenant test.
- Login/logout/refresh.
- Student CRUD.
- Teacher CRUD.
- Course/room/group CRUD.
- Attach/remove group students.
- Attendance.
- Payment + expense.
- Reminder.
- Leads.
- Settings.
- Tenant A cannot access Tenant B data.
- No console errors on critical flows.
- No dead buttons/placeholders presented as complete functionality.
- Production release/rollback commit.

Exit criteria:
- Admin/CRM panel is suitable to hand directly to an education center without explaining which buttons do not work.
