# FIX REPORT 29.1.1

Fixed issue where `@eduka_aibot` had access to Telegram Business chats but did not answer customer messages.

Root cause: Telegram Business Chat Automation sends updates as `business_message`, not as normal `message`.

Fix:
- webhook allowed updates expanded;
- backend parses `business_message`;
- backend replies using `business_connection_id`;
- messages and business connections are logged for admin monitoring.
