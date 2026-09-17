# Phase 2 — Record forms and lifecycle

- Server validates and normalizes telephone/email fields, trims text, rejects future birth dates, malformed months, unsafe numeric values and money precision exceeding two decimal places. Transactions require a positive amount.
- Duplicate checks are scoped to a center and run under its existing transaction lock. Named catalogs compare normalized name and branch (transaction category includes direction). People match full name plus telephone; employee emails are unique among active employee records. Shared family telephone numbers alone are not duplicates.
- Create forms send a stable UUID per unchanged submission. Migration 015 persists request fingerprints and record IDs. Repeating a committed request returns the existing record without repeating canonical writes, events or notifications. Reusing a key with changed data returns 409. External API callers must supply requestId for create retry protection.
- Form controls are locked while saving/uploading. Closing an edited form asks before discarding values. Nested create forms preserve the request UUID.
- Search matches name/surname terms and telephone numbers regardless of separators. Date filters constrain their range. Archive views include soft-deleted students; legacy status-only archived students can be returned to Faol.
- Archived records must be restored before editing. Restore checks duplicates and active relations again. Used catalogs cannot be archived while active records reference them.

Verification: production build/typecheck and isolated PostgreSQL/Express tests. Browser/mobile visual testing remains pending. This phase does not implement profile redesign or new financial accounting rules.
