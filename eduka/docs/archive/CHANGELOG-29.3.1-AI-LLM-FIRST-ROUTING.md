# Eduka 29.3.1 — AI LLM First Routing Fix

## Maqsad
`@eduka_aibot` eski FAQ javobini qaytarib yubormasligi, har bir savol avval LLM/OpenAI ga borishi.

## O‘zgarishlar
- LLM-first routing qo‘shildi.
- FAQ endi faqat AI context sifatida ishlatiladi.
- `AI_ASSISTANT_FORCE_LLM_FIRST=true` default qilindi.
- Default model `gpt-4.1-mini` qilindi.
- Coin/sovg‘alar/gamification intent alohida qo‘shildi.
- Telegram Business duplicate javoblar uchun `ai_assistant_processed_updates` guard qo‘shildi.
- LLM error bo‘lsa admin loglarda `llm_error` ko‘rinadi.
- `/api/app/ai-assistant/llm-status` ichida `force_llm_first` chiqadi.

## Test
- `Coin va sovg‘alar tizimi qanday ishlaydi?` savoliga endi `Eduka nima?` javobi qaytmasligi kerak.
- `salom`, `narxlar`, `demo`, `student app`, `parent app`, `to‘lov va davomat` kabi savollar LLM orqali javob oladi.
