# Eduka 22.1.6 — Student App Auto-login Final Fix

## Fixed
- Student App fake phone status bar removed.
- Telegram bot Student App URLs now use path token format: `/app/open/:token?v=2216`.
- Student App now reads token from query, hash, or `/app/open/:token` path.
- Telegram chat menu button is updated per student after successful registration, so the bottom "Student APP" button opens the tokenized dashboard URL.
- Existing linked students who run `/start` receive a fresh Student App token and the Telegram menu button is refreshed.
- Student App no longer shows internal login/password form.

## Expected Flow
`/start → phone → code/password → confirm → Student App'ni ochish → /app/open/:token → Dashboard`
