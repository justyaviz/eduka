# EDUKA tenant CRM integration

## Routing and deployment

The existing `eduka2` Express application remains the deployment root. `npm run build` compiles `crm-client` into `public/crm` and writes the new client shell to `public/app.html`. Railway `elegant-wonder`, services `eduka-frontent` and `backend/`, already build the `main` branch at `/eduka2`. No new project, domain, DNS, database or environment secrets are required.

Apex landing, pricing and CEO HTML/CSS/JS remain byte-for-byte unchanged. Known tenant hosts resolve all page routes to the new CRM. Unknown tenants fail closed. Legacy client JS/CSS are retained as inactive rollback assets; the new shell does not load them. There is no iframe or redirect to ChatGPT Sites.

## Authentication and data

The CRM uses the existing `/api/tenant/login`, `centers`, `center_users` and `JWT_SECRET`. Login additionally sets a host-only, HttpOnly, SameSite=Strict session cookie (Secure in production). Each request verifies tenant/token identity, active center and active account. Role checks use existing `rbac.roles.v1` permissions and built-in roles. No credentials or production data are committed.

Migration `009_eduka_workspace.sql` only adds tenant-scoped records, events and private file storage in the existing PostgreSQL database. Uploads are limited to 20 MB per file and are stored as BYTEA, not on an ephemeral Railway disk.

On the first CRM load per center, existing branches, courses, rooms, staff, teachers, groups, students, enrollments, attendance, reminders, payments, expenses and leads are imported with their IDs. A per-center transaction lock and marker make this cutover idempotent. Subsequent CRM edits mirror core fields to canonical tables, so CEO student/branch counts remain consistent. Existing balances become a protected opening adjustment, preserving the net balance across imported payments. The new workspace is the record-authoring source after cutover; the inactive legacy client must not be used for parallel edits. Legacy external writers require a dedicated synchronization adapter before use.

Existing financial direction and student/group bindings are immutable on editing; archive and recreate when these need correcting. This prevents a transaction from silently moving between accounts.

## Validation

`npm run build` compiles TypeScript and production assets. `npm test` runs the actual Express routes against an isolated embedded PostgreSQL engine, never the production database. It covers apex/CEO HTML preservation, tenant deep links, unknown tenant rejection, native login cookie, cross-tenant rejection, revoked users, idempotent legacy import, balance preservation, canonical writes, duplicates, optimistic updates, audit events, installments and private uploads/downloads.

## Scope limits retained from the standalone CRM

SMS/payment providers, telephony, Face ID, automated tuition/proration/payroll, rich contract signing and complete online-course delivery are not newly connected by this migration. The existing CEO billing/provider APIs remain unchanged. New CRM role records are configuration; account provisioning continues through the existing center administration endpoints/CEO flow. The migration does not copy data from the separate ChatGPT-hosted workspace.

## Rollback

The previous source revision remains in Git history and a pre-cutover branch. Reverting the frontend release does not delete canonical or new workspace tables. After real users author new extension records, preserve the workspace tables when reverting. Never drop them for rollback. New fields that exist only in the workspace will not appear in the old client.
