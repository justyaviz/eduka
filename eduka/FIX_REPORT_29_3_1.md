# FIX REPORT 29.3.1

## Muammo
AI bot savol LLM ga yetmasdan oldin eski FAQ javobini qaytarayotgan edi. Masalan, “Coin va sovg‘alar tizimi qanday ishlaydi?” savoliga “Eduka nima?” javobi kelayotgan edi.

## Sabab
FAQ fallback va umumiy keyword matching LLM routingdan kuchliroq ishlagan. Business update ba’zan duplicate kelib, javob ikki marta chiqishi mumkin edi.

## Fix
- LLM-first routing joriy qilindi.
- FAQ direct reply `forceLlmFirst=false` bo‘lgandagina ishlaydi.
- Duplicate guard qo‘shildi.
- Gamification intent qo‘shildi.
- Default model `gpt-4.1-mini` qilindi.

## Railway Variables
```
OPENAI_API_KEY=sk-...
AI_ASSISTANT_LLM_ENABLED=true
AI_ASSISTANT_PROVIDER=openai
AI_ASSISTANT_MODEL=gpt-4.1-mini
AI_ASSISTANT_FORCE_LLM_FIRST=true
AI_ASSISTANT_MAX_OUTPUT_TOKENS=650
```
