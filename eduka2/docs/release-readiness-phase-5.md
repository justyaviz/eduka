# Phase 5 — delivery readiness, 2026-10-01

## Implemented
CRM reloads cancel superseded requests and cancel on unmount. Aborted responses cannot replace newer data or clear its loading state. Each page request has a 30-second timeout and Uzbek retry error. Repeated pagination cursors stop; IDs are deduplicated. Successful writes during loading restart the read to avoid overwriting saved data with stale responses.

Relation labels use a memoized ID map. Branch membership is calculated once per filter pass rather than once per row.

## Verified
Existing isolated integration suite passes: tenant isolation, empty provisioning, trial 3/7/10, student limits, pagination, finance/refunds, study validations, staff access and notification mocks. No real SMS/Telegram sent or production business data changed.

Desktop browser renders EDUKA login at alfa.eduka.uz. No site-origin console errors observed. TypeScript and Vite build pass; bundle warning remains.

Railway Postgres has a persistent volume at /var/lib/postgresql/data. This does NOT establish backup coverage. Available connector does not expose backup schedules/history. No backup was enabled or restore executed in this increment.

## Open release gates
- Authenticated pilot center: student/course/room/group creation, enrollment, attendance, payment/refund, staff permissions, reload/deep links and logout. Login required; no current center session available.
- Real mobile acceptance: menu, forms, profile, tables, receipt, chat and dialogs. Browser tool exposes no viewport emulation; desktop checks are not phone tests.
- Backup owner: verify schedule, retention, last successful snapshot and failure alerts in Railway. Record evidence.
- Restore into an isolated non-production database, NEVER over production for testing. Disable outbound notification workers; use distinct domain/secrets. Validate migrations, counts by center, sample balances and private files. Record recovery point and restore duration. Restrict backup access and protect encryption keys separately. CSV export is not a full backup.
- Performance: startup still fetches all accessible records in pages of 500. Server filtered lists, aggregate endpoints and code splitting remain needed. No large-data/concurrency benchmark run; JS bundle remains above 500 kB.
- One pilot owner/admin and teacher must complete workflows and review defects before broad rollout. External fiscal/payment integrations require separate acceptance.

## Operator sequence
CEO creates center/trial → admin signs in at subdomain → center settings/branch/cash/course/room/employee → group/schedule → student/enrollment → attendance → payment/balance statement → staff permissions. New center must be empty and isolated.

## Rollback
Record commit and both deployment statuses. Redeploy prior known-good version for this frontend-only change. No database migration or rollback required; do not reset production data.
