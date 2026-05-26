# Eduka 22.0.2 — Student Create Freeze Fix

## Fixed
- Talaba yaratish drawer submit now has a real loading state and cannot be double-submitted.
- API requests now include an 18s timeout instead of hanging forever.
- Student creation no longer waits for notification/audit side tasks before returning success.
- Refresh after create now uses a safer partial refresh so one slow endpoint cannot freeze the UI.
- Error states are shown inside the drawer and as toast messages.

## Deploy note
After deploy, hard refresh or open with `?v=2202` to avoid old cached JS.
