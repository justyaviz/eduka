# Phase 4 — Payments, receipts and reconciliation

- Receipt API reads a saved transaction within the authenticated center. It returns the original recorded actor, student, group, cashbox, version and cancellation status. Old records without a create event explicitly have no recorded cashier. Reopening does not assign the viewing user as cashier.
- Receipts can be reopened for income, refund/expense and archived transactions; archived receipts are marked cancelled. HTML download and receipt-only print/PDF are available. No general page print action is added. Receipts are internal confirmations, not fiscal receipts.
- Cash summary separates receipts, student refunds and other expenses, using integer minor units. Date filters affect cash flows; current student debt/credit uses all dates and opening student balances. Canonical student balances are compared with the record ledger; differences are reported, not silently overwritten.
- Summary covers all center branches and states that scope. Net cash movement is not a cashbox balance including opening cash.
- Partial and advance payments, charges, discounts and refunds use the existing signed ledger. Existing request IDs prevent duplicate payment creation. This release does not connect online payment or fiscal providers.

Validation: isolated PostgreSQL tests cover saved receipt identity, tenant boundary, cancelled receipts, date ranges, cash arithmetic and balance reconciliation; production typecheck/build and generated-asset validation.
