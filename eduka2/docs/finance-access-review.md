# Finance and staff review — 2026-10-02

## Changes
- `finance.collect` grants only creation of incoming student payments. It cannot edit, archive or restore existing transactions, record refunds, or create unrelated income. Explicit finance create/manage permissions retain their existing scope.
- Built-in cashier accounts cannot access salary, bonus or penalty records or payroll previews. Directors/accountants retain their configured access.
- UUID custom roles resolve only from active role records. Archiving/removing a custom role no longer revives cached permissions from center_settings. Legacy non-UUID role configurations retain compatibility.
- Payroll calculations accumulate monetary values as integer tiyin, validate rate/percentage and safe ranges, round the revenue share to tiyin, and date payroll payouts in Asia/Tashkent.
- Date-filtered financial summaries exclude undated records, and summaries exclude unknown transaction directions. Both exclusions are reported to the user instead of silently altering the totals.

## Verification
The isolated CRM suite covers payments, charges, discounts, refunds, balance reconciliation, tenant boundaries, employee login revocation, custom role actions and idempotent payroll payment. `tests/finance-access.cjs` adds regression coverage for cashier mutation boundaries, payroll visibility, archived-role cached permissions, decimal payroll arithmetic and excluded-record warnings. No production financial records were created or changed during testing.

## Calculation scope
Existing payroll rule remains base salary + attended group/date count × lesson rate + positive net group revenue share + bonuses − penalties, floored at zero. A lesson is a group/date with at least one present/late/first-lesson attendance; historical teacher attribution still uses the group's current teacher. Existing saved payroll is immutable and is not recalculated automatically. This is not a live bank payout or a review of every production center's historical balances.
