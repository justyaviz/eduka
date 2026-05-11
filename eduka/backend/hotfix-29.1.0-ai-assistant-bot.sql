CREATE TABLE IF NOT EXISTS ai_assistant_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ai_assistant_faqs (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE,
  title TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  answer TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ai_assistant_conversations (
  id SERIAL PRIMARY KEY,
  telegram_user_id TEXT UNIQUE NOT NULL,
  chat_id TEXT NOT NULL,
  username TEXT,
  first_name TEXT,
  state TEXT NOT NULL DEFAULT 'idle',
  draft JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ai_assistant_leads (
  id SERIAL PRIMARY KEY,
  chat_id TEXT,
  telegram_user_id TEXT,
  username TEXT,
  full_name TEXT,
  phone TEXT,
  center_name TEXT,
  city TEXT,
  student_count TEXT,
  source TEXT NOT NULL DEFAULT 'telegram_ai_bot',
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ai_assistant_messages (
  id SERIAL PRIMARY KEY,
  chat_id TEXT,
  telegram_user_id TEXT,
  direction TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  text TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_assistant_messages_chat ON ai_assistant_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_assistant_leads_status ON ai_assistant_leads(status, created_at DESC);

INSERT INTO ai_assistant_faqs (key,title,keywords,answer,sort_order) VALUES
('about','Eduka nima?',ARRAY['eduka','nima','crm','platforma','haqida'],'Eduka — o‘quv markazlar uchun CRM, Student App, Parent App, Telegram bildirishnomalar, to‘lov, davomat, gamification va hisobotlarni bir joyda boshqaradigan SaaS platforma.',1),
('features','Imkoniyatlar',ARRAY['imkoniyat','funksiya','nimalar','modul'],'Eduka imkoniyatlari: talabalar, guruhlar, o‘qituvchilar, dars jadvali, davomat, to‘lovlar, qarzdorlik, chek/QR, Telegram xabar, Student App, Parent App, coin/rewards, hisobotlar va CEO SaaS boshqaruvi.',2),
('pricing','Narxlar',ARRAY['narx','tarif','qancha','tolov','to‘lov','price'],'Eduka tariflari markaz hajmiga qarab Start, Pro, Business va Enterprise shaklida sozlanadi. Aniq narx uchun demo so‘rov qoldiring — sizga mos paket tavsiya qilamiz.',3),
('student_app','Student App',ARRAY['student app','oquvchi app','o‘quvchi app','student','ilova'],'Student App orqali o‘quvchi dars jadvali, to‘lov holati, davomat, coin, sovg‘alar, reyting, yutuqlar, materiallar, uyga vazifa va bildirishnomalarni ko‘radi.',4),
('parent_app','Parent App',ARRAY['parent','ota-ona','ota ona','farzand'],'Parent App ota-onaga farzandining jadvali, to‘lov holati, qarzdorligi, davomati, vazifalari va bildirishnomalarini ko‘rsatish uchun rejalangan modul.',5),
('telegram','Telegram xabarlar',ARRAY['telegram','bot','xabar','sms','notification'],'Eduka Telegram bot orqali to‘lov, coin, sovg‘a statusi, davomat, dars eslatmasi, qarzdorlik va uyga vazifa xabarlarini yubora oladi.',6),
('demo','Demo olish',ARRAY['demo','korish','ko‘rish','sinab','ulanish'],'Demo olish uchun “Demo ko‘rish” tugmasini bosing. Ism, telefon, markaz nomi, shahar va talabalar sonini qoldirsangiz, operator siz bilan bog‘lanadi.',7)
ON CONFLICT (key) DO UPDATE SET title=EXCLUDED.title, keywords=EXCLUDED.keywords, answer=EXCLUDED.answer, sort_order=EXCLUDED.sort_order, updated_at=NOW();
