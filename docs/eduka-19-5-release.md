# Eduka 19.5 Release Notes

Eduka 13.1 -> 19.5 upgrade scope completed in codebase.

## Main upgrade areas

1. Multi-tenant SaaS foundation
- Super Admin dashboard API
- Education center creation wizard
- Center admin login/password generation
- Organization status lifecycle: trial, active, overdue, blocked, archived
- Organization plan limits: students, teachers, branches, SMS, storage
- Organization feature flags
- Host/subdomain-oriented tenant model

2. Super Admin platform management
- Centers list/profile APIs
- Plans/tariffs API
- Subscriptions API compatibility
- Invoices API
- Domain/subdomain management API
- Support tickets API
- Audit log API
- Admin password reset API

3. Domain and subdomain management
- `organization_domains`
- Verification token
- DNS status
- SSL status
- Primary domain flag
- DNS target instructions: `cname.eduka.uz`

4. Permissions and roles foundation
- `admin_roles`
- `admin_permissions`
- `organization_roles`
- `organization_permissions`
- Built-in organization roles: Owner, Admin, Manager, Operator, Teacher, Accountant, Student, Parent

5. Billing foundation
- `subscription_invoices`
- `subscription_payments`
- Subscription period fields
- Next payment date
- Payment status
- Invoice status: unpaid, paid, overdue, cancelled

6. Organization dashboard upgrade
- `/api/org/dashboard`
- KPI summary
- Revenue/expense chart data
- Today lessons
- Recent activity

7. Student App professional endpoints
- `/api/student/dashboard`
- `/api/student/payments`
- `/api/student/attendance`
- `/api/student/homeworks`
- `/api/student/exams`
- `/api/student/feedback`
- `/api/student/library`
- `/api/student/dictionary`
- `/api/student/news`
- `/api/student/events`
- `/api/student/referrals`
- `/api/student/group`
- `/api/student/study`
- `/api/student/rating`

8. Demo behavior
- Demo login remains disabled.
- Student App frontend now uses professional `/api/student/*` endpoints.
- Demo/reference data is allowed only when explicitly enabled with `?demo=1` or `localStorage.eduka_allow_demo=1` for development testing.

## Database tables added

- organization_domains
- organization_branding
- organization_feature_flags
- plan_features
- subscription_invoices
- subscription_payments
- admin_roles
- admin_permissions
- organization_roles
- organization_permissions
- support_tickets
- support_messages
- domain_verifications
- api_keys
- notification_rules
- notification_logs

## Important deployment note

After pushing this version, restart the backend so `backend/schema.sql` can apply new tables/columns. If Railway/Postgres permissions block schema updates, run `backend/schema.sql` manually in the database console.

## External integrations still require credentials

These cannot be proven working without real provider keys:
- DNS/SSL automation provider API
- SMS provider API
- Telegram bot token
- Payment provider API
- Email provider API

The code now stores domain/status/invoice/support/notification records, but real provider delivery requires credentials.
