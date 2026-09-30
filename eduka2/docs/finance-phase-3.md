# Finance workflow — phase 3

- Added a tenant-scoped student statement API. Charges decrease the student balance; payments and discounts increase it; refunds decrease it. Cancelled records are excluded.
- Date filters carry earlier operations into the opening balance and omit operations after the end date. Rows are ordered by transaction date, creation timestamp and ID.
- Cash overview now identifies individual student balances, stored balances and differences, including missing canonical student rows. No automatic repair or destructive reconciliation is performed.
- Added searchable debt/credit/mismatch lists, 25-row table pages, CSV exports, statement details and links to saved transaction receipts. Overview also appears on charges and discounts pages.
- Shared minor-unit arithmetic is used for statement calculations and canonical student balance updates to avoid repeated floating-point accumulation.

Validation: full isolated integration suite, TypeScript, frontend production build and asset check passed. Cases include decimals, date bounds and opening balances, refunds, cancellation, missing IDs and cross-tenant requests. No production financial records were modified for testing. Authenticated desktop/mobile visual signoff remains pending.

Limits: current balances include all recorded dates; period statements follow the selected range. An internal receipt is not a fiscal receipt. This increment does not integrate payment providers, automatically refund money, introduce opening cash balances or change payroll rules. Balance lists use existing center-wide loading; server pagination is not introduced here.
