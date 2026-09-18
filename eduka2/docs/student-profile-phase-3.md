# Phase 3 — Student profile

Student profiles now expose parent contacts, monthly grades, dated notes and private student files alongside existing attendance, tasks and contracts. Photos use the tenant file store; the server rejects non-image profile attachments. New tabs are appended to previously saved tab ordering.

Group summaries include course, teacher and schedule. Financial history includes editable discount records and explicit incoming-payment/refund creation. The shared ledger calculation continues to exclude archived records. Profile activity includes related records present in the loaded event history; it is not a complete lifetime audit export.

Record forms render above the profile dialog so profile actions can be completed. New notes and files use student permissions and tenant-scoped relation/file validation. No schema migration is required.

Validation: TypeScript/build, isolated PostgreSQL tests for profile attachments, notes, grade limits, refresh persistence and tenant isolation. Also covers demo conversion credential delivery response, fixing a pre-existing notification variable scope error. Manual device/browser verification remains outstanding.
