# Eduka 29.1.2 — AI Bot Business Reply Fix

## Tuzatildi
- Telegram Business Chat Automation xabarlarida inline keyboard sabab javob bloklanishi ehtimoli yopildi.
- Business chatlarga endi text-only reply yuboriladi.
- `/start`, `salom`, `assalomu alaykum`, `hello` xabarlari welcome flowga bog'landi.
- Business xabar kelganda Railway logs’da `AI BOT business_message received` chiqadi.
- Telegram sendMessage xatosi `ai_assistant_messages` ichida `out_error` sifatida log qilinadi.

## Test
- Chat Automation ulangan mijoz chatida `salom`, `/start`, `narxlar`, `demo` yozib tekshiring.
