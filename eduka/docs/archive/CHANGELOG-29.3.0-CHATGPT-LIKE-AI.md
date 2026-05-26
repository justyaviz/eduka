# Eduka 29.3.0 — ChatGPT-like AI Assistant

## Added
- OpenAI Responses API integration for @eduka_aibot.
- Smart LLM replies for Telegram Business and regular bot chats.
- Conversation memory + FAQ context passed to the model.
- Lead scoring and intent analysis preserved as business logic.
- Rule-based fallback remains active when OPENAI_API_KEY is missing or API fails.
- Admin endpoints:
  - GET /api/app/ai-assistant/llm-status
  - POST /api/app/ai-assistant/llm-test

## Required env
- OPENAI_API_KEY
- AI_ASSISTANT_LLM_ENABLED=true
- AI_ASSISTANT_PROVIDER=openai
- AI_ASSISTANT_MODEL=gpt-5.5-mini
