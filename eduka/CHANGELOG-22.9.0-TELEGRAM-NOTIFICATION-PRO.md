# Eduka 22.9.0 — Telegram Notification Pro

## Added
- Telegram notification logs and settings tables.
- Automatic Telegram notifications for student payments.
- Automatic Telegram notifications for attendance changes.
- Automatic Telegram notifications for reward request status updates.
- Homework/material creation notifications.
- Manual debt reminder endpoint.
- Manual lesson reminder endpoint.
- Admin API for Telegram notification settings and logs.

## API
- `GET /api/app/telegram-notifications`
- `PUT /api/app/telegram-notifications`
- `POST /api/app/telegram-notifications/debt-reminders`
- `POST /api/app/telegram-notifications/lesson-reminders`

## Safety
- All Telegram sends are non-blocking for business workflows.
- If a student is not connected to Telegram, notification is logged as skipped.
- If Telegram API fails, the main CRM action still succeeds.
