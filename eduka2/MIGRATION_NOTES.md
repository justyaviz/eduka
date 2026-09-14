# V3 migration notes

V3 does not delete legacy `crm_*` business tables automatically. It copies compatible data into the canonical tables while preserving UUIDs where possible.

Canonical tables include:
- `centers`, `center_users`
- `students`, `teachers`, `courses`, `rooms`
- `study_groups`, `group_students`
- `center_payments`, `center_expenses`, `attendance`, `reminders`, `leads`

Legacy plaintext credentials are no longer used. `crm_tenant_admins` credentials are migrated into hashed `center_users` records when a matching center exists, then the old plaintext password is replaced with a disabled marker. `organizations.admin_password` is cleared when present.

Take a Railway database backup before first deployment.
