# Eduka 21.3.0 — Thermal Receipt + QR Telegram Bot

## Added
- 80mm thermal printer receipt design matching the reference style.
- Dynamic logo from organization logo URL / branding logo URL.
- Dotted leader rows for receipt fields.
- Payment amount summary box: payable, paid, current balance.
- QR code generated from Telegram deep link:
  `https://t.me/edukauz_bot?start=receipt_<receiptNumber>`
- Telegram bot `/start receipt_<receiptNumber>` handler.
- Telegram bot sends a full Uzbek payment confirmation message with emojis.
- Public receipt lookup helper endpoint: `/api/public/receipts/:receiptNumber`.

## Updated
- Receipt settings now include bot username.
- Receipt prefix default changed to `CHK`.
- Print CSS uses 80mm paper with clean black/white output.
- App cache version bumped to 21.3.0.
