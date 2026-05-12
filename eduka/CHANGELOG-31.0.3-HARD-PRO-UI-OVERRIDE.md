# Eduka 31.0.3 — Hard Pro UI Override Fix

Fixed legacy admin UI still appearing after 10–20 seconds on Pro routes.

## Root cause
Old `app.js` legacy dashboard/list render still writes content into the same `.view` sections after async data loading. Previous fixes only re-rendered Pro UI, but legacy DOM remained visible below/around it.

## Fix
- Pro routes now become authoritative.
- Legacy children inside Pro route views are hidden with CSS.
- `[data-crm305-mount]` is the only visible content in Pro views.
- The active view is forced based on the actual URL.
- The Pro renderer is re-triggered after route changes, legacy render events, and delayed async mutations.
- `/admin/dashboard`, `/admin/students`, `/admin/teachers`, `/admin/groups`, `/admin/payments`, `/admin/attendance` are covered.
