# Fix Report 22.9.0

Implemented Telegram Notification Pro. The platform now records notification attempts in `telegram_notification_logs`, supports enable/disable switches in `telegram_notification_settings`, and sends messages for payments, coins, rewards, attendance, homework, materials, debts, and lesson reminders.

If Railway database is missing tables, run:

```sql
-- backend/hotfix-22.9.0-telegram-notification-pro.sql
```
