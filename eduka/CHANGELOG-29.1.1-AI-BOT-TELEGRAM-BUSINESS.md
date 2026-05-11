# Eduka 29.1.1 — AI Bot Telegram Business Support

## Added
- Telegram Business `business_connection` support.
- Telegram Business `business_message` support.
- `edited_business_message` and `deleted_business_messages` audit logging.
- `business_connection_id` support for Telegram `sendMessage` responses.
- Webhook `allowed_updates` now includes Business updates.
- Admin AI Assistant overview shows Business connections and Business message count.

## New DB fields
- `ai_assistant_business_connections`
- `ai_assistant_conversations.business_connection_id`
- `ai_assistant_conversations.is_business_chat`
- `ai_assistant_messages.business_connection_id`
- `ai_assistant_messages.business_message_id`
- `ai_assistant_messages.is_business_message`

## Deploy
Open `/api/ai-bot/set-webhook` again after deploy so Telegram starts sending Business updates.
