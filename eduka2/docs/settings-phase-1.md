# Settings phase 1

Implemented and covered by isolated database/API tests:
- One active configuration per center and settings section; edits use optimistic versions.
- Owner/director-only configuration writes and server-side field/type/range validation.
- Center name updates the canonical center record and next login/session. Name/logo render in CRM header. Name/logo/phone/address and receipt title/footer/font size render on internal receipts.
- Logo accepts center-owned PNG/JPEG/WebP, maximum 2 MB.
- Opening/closing time bounds new/edited group schedules; default lesson duration supplies missing end time.
- Maximum group capacity checked on enrollment creation/update, under the center transaction lock.
- Student phone/birth-date/source requirements; maximum assessment grade; past attendance edit/archive restriction.
- Table page size, attendance initial selection and existing attendance coin rule.
- Payment category direction and minimum/maximum amount validation.
- Settings form refreshes after saved version changes, displays errors and warns before discarding edits.
- Links to existing branches, transaction categories and contract template managers.

Existing unimplemented switches remain visible as disabled “Hali ulanmagan”. Their existing stored values are preserved but cannot newly enable an automation that does not exist. Finance automation, automatic discounts, app/Face ID, SMS, advanced filter styles, auto-print and receipt QR remain later-phase work. Currency switching is disabled because financial records are currently UZS.

Validation: npm run build; npm test (PGlite PostgreSQL + actual Express routes). Live browser/mobile visual validation is not covered by these tests.
