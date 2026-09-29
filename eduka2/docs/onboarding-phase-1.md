# Phase 1: center launch — 2026-09-29

## Changes
- Clear tenant lookup cache after manual center creation and demo conversion. A hostname visited before provisioning no longer stays 404 until cache expiry.
- Serialize demo slug allocation with manual provisioning to prevent duplicate-name races.
- Normalize generated slugs; reserve platform hostnames, including CEO/API/admin.
- Generated administrator login uses the allocated unique slug.
- Both creation paths accept only 3/7/10 trial days; validate optional administrator email.
- Credential-bearing creation responses use no-store.
- CRM home has a responsive, database-derived launch checklist: center contact/address, branch, room, course, cash desk, first student. Owner/director/admin only. Completed checklist disappears; archiving a prerequisite reopens its step. No sample records or browser-only completion flags.
- Landing and CEO design unchanged.

## Verification
- npm test: isolated PGlite integration suite passed. Includes negative tenant cache followed by creation and immediate HTTP 200, duplicate slug rejection, invalid email/trial rejection, reserved-name conversion, repeat conversion idempotency, 3/7/10 day trial endpoints, login, empty workspace, tenant isolation, credential reset, expired writes.
- Frontend typecheck and Vite build passed.
- Test runner fixes: Node/PostgreSQL UTC agreement; assert canonical generated CRM HTML rather than stale legacy public/app.html.

## Limits
- Live authenticated onboarding still requires a CEO/center browser session for visual end-to-end sign-off. Automated tests create only isolated local data.
- Checklist links reuse working forms; not a separate wizard.
- External provider integrations and backup restore are outside this phase.
