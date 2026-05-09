-- Eduka 21.7.0 student/parent access scaffold
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name VARCHAR(160);
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_telegram_chat_id VARCHAR(80);
ALTER TABLE students ADD COLUMN IF NOT EXISTS app_enabled BOOLEAN DEFAULT TRUE;
