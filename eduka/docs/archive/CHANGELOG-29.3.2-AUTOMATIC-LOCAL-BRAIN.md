# Eduka 29.3.2 — Automatic Local Brain Bot

## Maqsad
OpenAI/Gemini/Groq/OpenRouter kabi pullik yoki tashqi AI providerlarsiz ishlaydigan professional avtomatik Eduka assistant.

## Qilingan ishlar
- Tashqi LLM default o‘chirildi.
- OPENAI quota/billing xatolari mijozga chiqmaydi.
- Eduka local rule-brain qo‘shildi.
- Har savolda modul/topic aniqlanadi: pricing, gamification, student app, parent app, telegram, payments, attendance, materials, homework, reports, security, CEO.
- Coin/sovg‘alar savoliga endi “Eduka nima?” javobi qaytmaydi.
- Telegram Business uchun text-only smart javob saqlandi.
- Conversation memory va lead scoring saqlandi.

## Railway Variables
Tashqi AI kerak emas. Tavsiya:
AI_ASSISTANT_LOCAL_BRAIN_ENABLED=true
AI_ASSISTANT_EXTERNAL_LLM_ENABLED=false
AI_ASSISTANT_PROVIDER=local
