# Phase 5 — Groups, lessons and staff

## Delivered
- Group management panel: assign via validated enrollment form; transfer or remove a student in one database transaction. Old enrollments close with an end date; payments and attendance stay attached to the original group. Student version guards prevent stale/repeated transfers, and updating the primary group prevents later profile edits from reviving it.
- Group date/day/time overlap checks reject a room or teacher double booking. Adjacent lessons and different weekdays are accepted. Existing legacy schedules are not automatically rewritten.
- Room capacity and configured group capacity are checked on assignment. Room capacity zero/empty means no configured room limit.
- Attendance roster is based on membership dates. Bulk attendance includes Late, notes, existing record versions, and an explicit Mark all present action. Unmarked students are not written. Batch validation is atomic; coins and canonical attendance update within the same transaction.
- Monthly grades can be added from the roster and continue using the configured maximum grade. Group membership in the assessed month is checked. Teacher accounts can change attendance/grades only for their assigned groups.
- Existing staff creation and secure login/role management remain connected; duplicate employee login now returns a clear conflict. Custom roles preserve separate view/create/update/archive permissions, including existing roles previously cached with overly broad manage permissions.
- Payroll shows saved base, lesson amount, percentage, bonuses and penalties. The balance report uses the saved automatic total. Deleted adjustments are excluded; zero payouts rejected; payment requires salary-update and payment-create permissions. Existing paid salary idempotency remains.

## Validation and boundaries
- Isolated PostgreSQL-compatible integration tests cover schedule conflicts, attendance stale versions and rollback, tenant boundary, teacher scope, transfers, custom roles, bonus/penalty arithmetic and existing staff login/payroll workflows.
- Production build includes TypeScript and generated asset checks.
- No production student records, payments or employee credentials are created for testing.
- Payroll uses current group teacher assignments/rates at calculation time and freezes the calculated result. This is not a historical teacher-contract engine. A taught lesson is currently one group/date with at least one present or late student.
- No external SMS, fiscal, or turnstile integration is added. Landing and CEO design are unchanged.
