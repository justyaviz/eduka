# Learning process — phase 2

## Changes
- Group management shows course, teacher, room, study period and a dated roster with student profile links, phone and enrollment date. Group students has the same selector. Enrollment forms inherit the group price and selected date.
- Room capacities accept whole nonnegative numbers; zero is unlimited. Reducing capacity or changing a group's room checks existing active students and enrollments. Archived students do not consume room capacity. Active reservations are counted conservatively, including future enrollments.
- Groups and rooms with explicit branches must agree. Changing a room's branch is rejected while attached non-archived groups use another branch.
- Enrollment dates must fit the configured group period. Groups cannot end before an active enrollment starts.
- Schedule week/day calculations use Asia/Tashkent consistently. Groups without time/end time or the selected resource, or starting outside displayed hours, appear in a visible list instead of disappearing.

## Verification and limits
- Full isolated PostgreSQL-compatible integration suite passes new capacity-edit, branch and enrollment-period cases, plus existing collision, transfer, attendance rollback, teacher authorization and tenant isolation checks.
- Frontend TypeScript, production build and generated CRM assets checked.
- No live student, attendance or payment fixtures created. Authenticated desktop/mobile visual signoff remains pending.
- Existing attendance and transfer behavior is preserved. Holiday exceptions, historical timetable versions and arbitrary recurring weekday selection are not implemented in this increment.
