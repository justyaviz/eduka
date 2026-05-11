const https = require('https');

const DEFAULT_FAQS = [
  {
    key: 'about',
    title: 'Eduka nima?',
    keywords: ['eduka', 'nima', 'crm', 'platforma', 'haqida', 'tizim', 'avtomatlashtirish'],
    answer: 'Eduka — o‘quv markazlar uchun CRM, Student App, Parent App, Telegram bildirishnomalar, to‘lov, davomat, gamification va hisobotlarni bir joyda boshqaradigan SaaS platforma.'
  },
  {
    key: 'features',
    title: 'Imkoniyatlar',
    keywords: ['imkoniyat', 'funksiya', 'nimalar', 'modul', 'qila oladi', 'nima bor'],
    answer: 'Eduka imkoniyatlari: talabalar, guruhlar, o‘qituvchilar, dars jadvali, davomat, to‘lovlar, qarzdorlik, chek/QR, Telegram xabar, Student App, Parent App, coin/rewards, hisobotlar va CEO SaaS boshqaruvi.'
  },
  {
    key: 'pricing',
    title: 'Narxlar',
    keywords: ['narx', 'tarif', 'qancha', 'to‘lov', 'tolov', 'price', 'oyiga', 'pul'],
    answer: 'Eduka tariflari markaz hajmiga qarab Start, Pro, Business va Enterprise shaklida sozlanadi. Aniq narx uchun o‘quvchilar soni va kerakli modullarni yozing — sizga mos paket tavsiya qilamiz.'
  },
  {
    key: 'student_app',
    title: 'Student App',
    keywords: ['student app', 'o‘quvchi app', 'oquvchi app', 'student', 'ilova', 'kabinet'],
    answer: 'Student App orqali o‘quvchi dars jadvali, to‘lov holati, davomat, coin, sovg‘alar, reyting, yutuqlar, materiallar, uyga vazifa va bildirishnomalarni ko‘radi.'
  },
  {
    key: 'parent_app',
    title: 'Parent App',
    keywords: ['parent', 'ota-ona', 'ota ona', 'farzand', 'ota onalar'],
    answer: 'Parent App ota-onaga farzandining jadvali, to‘lov holati, qarzdorligi, davomati, vazifalari va bildirishnomalarini ko‘rsatish uchun rejalangan modul.'
  },
  {
    key: 'telegram',
    title: 'Telegram xabarlar',
    keywords: ['telegram', 'bot', 'xabar', 'sms', 'notification', 'bildirishnoma'],
    answer: 'Eduka Telegram bot orqali to‘lov, coin, sovg‘a statusi, davomat, dars eslatmasi, qarzdorlik va uyga vazifa xabarlarini yubora oladi.'
  },
  {
    key: 'payments',
    title: 'To‘lov va qarzdorlik',
    keywords: ['qarzdorlik', 'qarz', 'tolov', 'to‘lov', 'chek', 'kassa', 'finance'],
    answer: 'Eduka to‘lovlarni, qarzdorlikni, chek/QRni, kassa kirim-chiqimini va Telegram orqali to‘lov xabarlarini boshqarishga yordam beradi.'
  },
  {
    key: 'attendance',
    title: 'Davomat',
    keywords: ['davomat', 'kelmagan', 'keldi', 'darsga kelish', 'attendance'],
    answer: 'Davomat modulida keldi, kelmadi, kech qoldi va sababli holatlari yuritiladi. O‘quvchi va ota-ona bu ma’lumotlarni ilova yoki Telegram orqali ko‘rishi mumkin.'
  },
  {
    key: 'gamification',
    title: 'Gamification',
    keywords: ['coin', 'sovga', 'sovg‘a', 'reyting', 'yutuq', 'gamification', 'ragbat'],
    answer: 'Gamification modulida o‘qituvchi o‘quvchiga coin beradi, o‘quvchi coin evaziga sovg‘a oladi, reyting va yutuqlar orqali motivatsiya oshadi.'
  },
  {
    key: 'demo',
    title: 'Demo olish',
    keywords: ['demo', 'ko‘rish', 'korish', 'sinab', 'ulanish', 'test qilib', 'ko‘rsatib'],
    answer: 'Demo olish uchun ism, telefon, markaz nomi, shahar va o‘quvchilar sonini qoldiring. Operator siz bilan bog‘lanib, Eduka qanday ishlashini ko‘rsatadi.'
  }
];

function env(name, fallback = '') {
  return String(process.env[name] || fallback).trim();
}

function aiBotConfig() {
  const token = env('EDUKA_AI_BOT_TOKEN');
  const username = env('EDUKA_AI_BOT_USERNAME', 'eduka_aibot').replace(/^@/, '');
  const baseDomain = env('BASE_DOMAIN', 'eduka.uz').replace(/^https?:\/\//, '').replace(/\/$/, '');
  return {
    enabled: env('EDUKA_AI_BOT_ENABLED', 'true') !== 'false' && Boolean(token),
    token,
    username,
    adminChatId: env('EDUKA_AI_ADMIN_CHAT_ID'),
    webhookSecret: env('EDUKA_AI_WEBHOOK_SECRET'),
    webhookUrl: `https://${baseDomain}/api/ai-bot/webhook`,
    supportUsername: env('SUPPORT_TELEGRAM', '@eduka_admin')
  };
}

function telegramRequest(token, methodName, payload = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/${methodName}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = data ? JSON.parse(data) : null; } catch { parsed = null; }
        if (res.statusCode >= 200 && res.statusCode < 300 && (!parsed || parsed.ok !== false)) {
          resolve(parsed || { ok: true });
        } else {
          const err = new Error((parsed && parsed.description) || `Telegram API error ${res.statusCode}`);
          err.response = parsed;
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function keyboard(rows) {
  return { inline_keyboard: rows };
}

function mainMenuKeyboard() {
  return keyboard([
    [{ text: 'Demo ko‘rish', callback_data: 'ai:demo' }, { text: 'Narxlar', callback_data: 'ai:pricing' }],
    [{ text: 'Imkoniyatlar', callback_data: 'ai:features' }, { text: 'Student App', callback_data: 'ai:student_app' }],
    [{ text: 'Operator bilan bog‘lanish', callback_data: 'ai:operator' }]
  ]);
}

function demoCancelKeyboard() {
  return keyboard([[{ text: 'Bekor qilish', callback_data: 'ai:cancel' }]]);
}

function finalLeadKeyboard() {
  return keyboard([
    [{ text: 'Yana demo so‘rash', callback_data: 'ai:demo' }],
    [{ text: 'Asosiy menyu', callback_data: 'ai:menu' }]
  ]);
}

function normalizeText(text) {
  return String(text || '').toLowerCase().replace(/[’']/g, '').trim();
}

async function ensureAiAssistantSchema(pool) {
  await pool.query(`
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
    CREATE TABLE IF NOT EXISTS ai_assistant_business_connections (
      id SERIAL PRIMARY KEY,
      business_connection_id TEXT UNIQUE NOT NULL,
      user_id TEXT,
      user_first_name TEXT,
      user_username TEXT,
      is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS business_connection_id TEXT;
    ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS is_business_chat BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS memory JSONB NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS lead_score INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS last_intent TEXT;
    ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS interest_tags TEXT[] NOT NULL DEFAULT '{}';
    ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS qualified BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS summary TEXT;
    ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS business_connection_id TEXT;
    ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS business_message_id TEXT;
    ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS is_business_message BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS intent TEXT;
    ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0;
    ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS lead_score_delta INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS ai_reason JSONB NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE ai_assistant_leads ADD COLUMN IF NOT EXISTS intent TEXT;
    ALTER TABLE ai_assistant_leads ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE ai_assistant_leads ADD COLUMN IF NOT EXISTS interest_tags TEXT[] NOT NULL DEFAULT '{}';
    ALTER TABLE ai_assistant_leads ADD COLUMN IF NOT EXISTS ai_summary TEXT;
    CREATE TABLE IF NOT EXISTS ai_assistant_intent_logs (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER,
      chat_id TEXT,
      telegram_user_id TEXT,
      intent TEXT NOT NULL,
      confidence NUMERIC NOT NULL DEFAULT 0,
      score_delta INTEGER NOT NULL DEFAULT 0,
      entities JSONB NOT NULL DEFAULT '{}'::jsonb,
      suggested_action TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ai_assistant_messages_chat ON ai_assistant_messages(chat_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_assistant_messages_business ON ai_assistant_messages(business_connection_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_assistant_leads_status ON ai_assistant_leads(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_assistant_intent_logs_intent ON ai_assistant_intent_logs(intent, created_at DESC);
  `);

  for (const faq of DEFAULT_FAQS) {
    await pool.query(
      `INSERT INTO ai_assistant_faqs (key, title, keywords, answer, sort_order)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (key) DO UPDATE SET title=EXCLUDED.title, keywords=EXCLUDED.keywords, answer=EXCLUDED.answer, updated_at=NOW()`,
      [faq.key, faq.title, faq.keywords, faq.answer, DEFAULT_FAQS.indexOf(faq) + 1]
    );
  }
}

async function logMessage(pool, data) {
  await pool.query(
    `INSERT INTO ai_assistant_messages (chat_id, telegram_user_id, direction, message_type, text, payload, business_connection_id, business_message_id, is_business_message, intent, confidence, lead_score_delta, ai_reason)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13::jsonb)`,
    [
      String(data.chat_id || ''),
      String(data.telegram_user_id || ''),
      data.direction,
      data.message_type || 'text',
      data.text || '',
      JSON.stringify(data.payload || {}),
      data.business_connection_id || null,
      data.business_message_id || null,
      Boolean(data.is_business_message),
      data.intent || null,
      Number(data.confidence || 0),
      Number(data.lead_score_delta || 0),
      JSON.stringify(data.ai_reason || {})
    ]
  );
}

async function getConversation(pool, from, chat, options = {}) {
  const userId = String(from && from.id ? from.id : chat.id);
  const chatId = String(chat.id);
  const username = from && from.username ? String(from.username) : null;
  const firstName = from && from.first_name ? String(from.first_name) : null;
  const businessConnectionId = options.business_connection_id || null;
  const result = await pool.query(
    `INSERT INTO ai_assistant_conversations (telegram_user_id, chat_id, username, first_name, business_connection_id, is_business_chat)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (telegram_user_id) DO UPDATE SET
       chat_id=EXCLUDED.chat_id,
       username=EXCLUDED.username,
       first_name=EXCLUDED.first_name,
       business_connection_id=COALESCE(EXCLUDED.business_connection_id, ai_assistant_conversations.business_connection_id),
       is_business_chat=ai_assistant_conversations.is_business_chat OR EXCLUDED.is_business_chat,
       updated_at=NOW()
     RETURNING *`,
    [userId, chatId, username, firstName, businessConnectionId, Boolean(businessConnectionId)]
  );
  return result.rows[0];
}

async function setConversationState(pool, telegramUserId, state, draft = {}) {
  await pool.query(
    `UPDATE ai_assistant_conversations SET state=$2, draft=$3::jsonb, updated_at=NOW() WHERE telegram_user_id=$1`,
    [String(telegramUserId), state, JSON.stringify(draft || {})]
  );
}

async function sendBotMessage(pool, config, chatId, text, replyMarkup, options = {}) {
  if (!config.enabled) return { ok: false, skipped: true };

  const isBusiness = Boolean(options.business_connection_id);
  const payload = { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true };

  if (isBusiness) {
    payload.business_connection_id = options.business_connection_id;
    // Telegram Business chat automation xabarlarida inline keyboard ba'zi holatlarda
    // javobni bloklab qo'yadi. Business chat uchun avval text-only yuboramiz.
  } else if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  try {
    const result = await telegramRequest(config.token, 'sendMessage', payload);
    await logMessage(pool, {
      chat_id: chatId,
      direction: 'out',
      message_type: isBusiness ? 'business_text' : 'text',
      text,
      payload: { reply_markup: isBusiness ? null : (replyMarkup || null), telegram_result: result || null },
      business_connection_id: options.business_connection_id || null,
      is_business_message: isBusiness
    });
    return result;
  } catch (error) {
    await logMessage(pool, {
      chat_id: chatId,
      direction: 'out_error',
      message_type: isBusiness ? 'business_send_error' : 'send_error',
      text: String(error && error.message ? error.message : error),
      payload: { request_payload: payload, telegram_error: error && error.response ? error.response : null },
      business_connection_id: options.business_connection_id || null,
      is_business_message: isBusiness
    });
    throw error;
  }
}

async function answerCallback(config, callbackQueryId, text = '') {
  if (!config.enabled || !callbackQueryId) return;
  try { await telegramRequest(config.token, 'answerCallbackQuery', { callback_query_id: callbackQueryId, text }); } catch {}
}

async function findFaq(pool, input) {
  const text = normalizeText(input);
  if (!text) return null;
  const result = await pool.query(`SELECT * FROM ai_assistant_faqs WHERE is_active=TRUE ORDER BY sort_order ASC, id ASC`);
  for (const row of result.rows) {
    const keywords = Array.isArray(row.keywords) ? row.keywords : [];
    if (keywords.some((keyword) => text.includes(normalizeText(keyword)))) return row;
  }
  return null;
}


function includesAny(text, words) {
  return words.some((word) => text.includes(normalizeText(word)));
}

function extractEntities(input) {
  const raw = String(input || '');
  const text = normalizeText(raw);
  const phoneMatch = raw.match(/(\+?998[\s\-]?)?\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/);
  const studentCountMatch = raw.match(/(\d{2,5})\s*(ta\s*)?(o['‘`]?quvchi|student|talaba|bola|odam)?/i);
  const cityMatch = raw.match(/\b(toshkent|tashkent|samarqand|samarkand|buxoro|andijon|farg[‘'`]?ona|fergana|qo[‘'`]?qon|kokand|namangan|qarshi|termiz|jizzax|nukus|urganch|navoiy|guliston)\b/i);
  const centerMatch = raw.match(/(?:markaz(?:im|imiz)?|o['‘`]?quv markaz(?:i|imiz)?|academy|school|center)\s*(?:nomi)?\s*[:\-]?\s*([A-Za-zА-Яа-я0-9 '\-_.]{3,40})/i);
  const entities = {};
  if (phoneMatch) entities.phone = phoneMatch[0].replace(/\s+/g, '');
  if (studentCountMatch && Number(studentCountMatch[1]) > 5) entities.student_count = Number(studentCountMatch[1]);
  if (cityMatch) entities.city = cityMatch[0];
  if (centerMatch) entities.center_name = centerMatch[1].trim();
  const painPoints = [];
  if (includesAny(text, ['tolov', 'to‘lov', 'qarz', 'qarzdorlik', 'kassa', 'chek'])) painPoints.push('payments');
  if (includesAny(text, ['davomat', 'kelmadi', 'darsga kelish', 'attendance'])) painPoints.push('attendance');
  if (includesAny(text, ['student app', 'oquvchi app', 'o‘quvchi app', 'ilova'])) painPoints.push('student_app');
  if (includesAny(text, ['ota ona', 'ota-ona', 'parent'])) painPoints.push('parent_app');
  if (includesAny(text, ['telegram', 'sms', 'xabar', 'notification'])) painPoints.push('telegram');
  if (includesAny(text, ['coin', 'sovga', 'sovg‘a', 'reyting', 'gamification'])) painPoints.push('gamification');
  if (includesAny(text, ['hisobot', 'report', 'analitika', 'statistika'])) painPoints.push('reports');
  entities.pain_points = [...new Set(painPoints)];
  return entities;
}

function analyzeIntent(input, conversation = {}) {
  const text = normalizeText(input);
  const entities = extractEntities(input);
  let intent = 'unknown';
  let confidence = 0.35;
  let suggested_action = 'answer_with_context';
  let score_delta = 0;
  const tags = new Set(entities.pain_points || []);

  if (!text) return { intent, confidence, entities, score_delta, suggested_action, tags: [] };
  if (text === '/start' || text === '/menu' || includesAny(text, ['salom', 'assalom', 'hello', 'hi'])) {
    intent = 'greeting'; confidence = 0.88; suggested_action = 'welcome'; score_delta = 2;
  }
  if (includesAny(text, ['narx', 'tarif', 'qancha', 'price', 'oyiga', 'pul', 'to‘lov qancha', 'tolov qancha'])) {
    intent = 'pricing_request'; confidence = 0.9; suggested_action = 'qualify_student_count'; score_delta += 20; tags.add('pricing');
  }
  if (includesAny(text, ['demo', 'ko‘rmoqchiman', 'kormoqchiman', 'ko‘rsat', 'korsat', 'sinab', 'ulanish', 'boglanish', 'bog‘lanish'])) {
    intent = 'demo_request'; confidence = 0.92; suggested_action = 'collect_lead'; score_delta += 30; tags.add('demo');
  }
  if (includesAny(text, ['crm kerak', 'crm qidiryapman', 'avtomatlashtirish', 'tizim kerak', 'platforma kerak', 'oquv markazim bor', 'o‘quv markazim bor'])) {
    intent = 'crm_need'; confidence = 0.86; suggested_action = 'recommend_modules'; score_delta += 30; tags.add('crm_need');
  }
  if (includesAny(text, ['nimalar bor', 'imkoniyat', 'funksiya', 'qanday ishlaydi', 'modul'])) {
    intent = intent === 'unknown' ? 'feature_question' : intent; confidence = Math.max(confidence, 0.78); score_delta += 10;
  }
  if (includesAny(text, ['student app', 'o‘quvchi app', 'oquvchi app'])) {
    intent = 'student_app_question'; confidence = 0.86; score_delta += 12; tags.add('student_app');
  }
  if (includesAny(text, ['parent', 'ota ona', 'ota-ona'])) {
    intent = 'parent_app_question'; confidence = 0.86; score_delta += 10; tags.add('parent_app');
  }
  if (includesAny(text, ['operator', 'odam bilan', 'aloqa', 'telefon bering', 'menejer'])) {
    intent = 'support_request'; confidence = 0.9; suggested_action = 'operator'; score_delta += 20; tags.add('support');
  }
  if (entities.phone) { score_delta += 40; suggested_action = 'hot_lead_notify'; }
  if (entities.student_count) { score_delta += 20; tags.add('has_student_count'); }
  if (entities.center_name) { score_delta += 15; tags.add('has_center'); }
  if ((entities.pain_points || []).length >= 2) score_delta += 15;
  const previousScore = Number(conversation.lead_score || 0);
  const score_after = Math.max(0, Math.min(100, previousScore + score_delta));
  return { intent, confidence, entities, score_delta, score_after, suggested_action, tags: [...tags] };
}

function mergeMemory(memory = {}, analysis = {}, input = '') {
  const next = { ...(memory || {}) };
  const entities = analysis.entities || {};
  if (entities.phone) next.phone = entities.phone;
  if (entities.student_count) next.student_count = entities.student_count;
  if (entities.city) next.city = entities.city;
  if (entities.center_name) next.center_name = entities.center_name;
  const tags = new Set([...(next.interest_tags || []), ...(analysis.tags || [])]);
  next.interest_tags = [...tags];
  next.last_intent = analysis.intent;
  next.last_message = String(input || '').slice(0, 500);
  next.updated_at = new Date().toISOString();
  return next;
}

function leadTemperature(score) {
  if (score >= 75) return 'issiq';
  if (score >= 40) return 'iliq';
  return 'sovuq';
}

async function updateConversationIntelligence(pool, conv, analysis, input) {
  const memory = mergeMemory(conv.memory || {}, analysis, input);
  const tags = [...new Set([...(conv.interest_tags || []), ...(analysis.tags || []), ...(memory.interest_tags || [])])];
  const score = Math.max(0, Math.min(100, Number(conv.lead_score || 0) + Number(analysis.score_delta || 0)));
  const summary = [
    memory.student_count ? `${memory.student_count} ta o‘quvchi` : '',
    memory.center_name ? `Markaz: ${memory.center_name}` : '',
    memory.city ? `Shahar: ${memory.city}` : '',
    tags.length ? `Qiziqish: ${tags.join(', ')}` : ''
  ].filter(Boolean).join(' • ');
  await pool.query(
    `UPDATE ai_assistant_conversations SET memory=$2::jsonb, lead_score=$3, last_intent=$4, interest_tags=$5, qualified=$6, summary=$7, last_message=$8, updated_at=NOW() WHERE id=$1`,
    [conv.id, JSON.stringify(memory), score, analysis.intent, tags, score >= 75, summary || null, String(input || '').slice(0, 500)]
  );
  await pool.query(
    `INSERT INTO ai_assistant_intent_logs (conversation_id, chat_id, telegram_user_id, intent, confidence, score_delta, entities, suggested_action)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
    [conv.id, conv.chat_id, conv.telegram_user_id, analysis.intent, analysis.confidence, analysis.score_delta, JSON.stringify(analysis.entities || {}), analysis.suggested_action]
  );
  return { ...conv, memory, lead_score: score, last_intent: analysis.intent, interest_tags: tags, qualified: score >= 75, summary };
}

function smartReplyText(config, conv, analysis, faq) {
  const memory = conv.memory || {};
  const score = Number(conv.lead_score || analysis.score_after || 0);
  const temp = leadTemperature(score);
  const tags = new Set([...(conv.interest_tags || []), ...(analysis.tags || [])]);
  const painText = (analysis.entities.pain_points || []).length
    ? `Siz aytgan muammolar: ${analysis.entities.pain_points.join(', ')}.`
    : '';

  if (analysis.intent === 'greeting') {
    return [
      'Assalomu alaykum! Men <b>Eduka AI Assistant</b>man.',
      '',
      'Men o‘quv markazingiz uchun CRM, Student App, Parent App, Telegram xabarlar, to‘lov, davomat va gamification bo‘yicha maslahat beraman.',
      '',
      'Masalan yozing: “300 ta o‘quvchim bor, to‘lov va davomatni avtomatlashtirmoqchiman”.'
    ].join('\n');
  }

  if (analysis.intent === 'pricing_request') {
    if (!memory.student_count && !analysis.entities.student_count) {
      return [
        'Narx markazingiz hajmiga va kerakli modullarga qarab tanlanadi.',
        '',
        'Aniq tavsiya berishim uchun taxminan nechta o‘quvchingiz bor?',
        '',
        'Masalan: “150 ta o‘quvchi bor, to‘lov va davomat kerak”.'
      ].join('\n');
    }
    const count = analysis.entities.student_count || memory.student_count;
    const plan = count >= 500 ? 'Business yoki Enterprise' : count >= 150 ? 'Pro yoki Business' : 'Start yoki Pro';
    return [
      `Tushunarli. Taxminan <b>${count}</b> ta o‘quvchi uchun sizga <b>${plan}</b> tarifi mos keladi.`,
      '',
      'Eduka orqali siz to‘lov, davomat, qarzdorlik, Telegram xabarlar va Student App’ni bitta joydan boshqarasiz.',
      '',
      'Demo ko‘rsatib, markazingizga mos paketni tanlab beraymi?'
    ].join('\n');
  }

  if (analysis.intent === 'demo_request') {
    return [
      'Albatta, demo tashkil qilamiz.',
      '',
      'Demo uchun quyidagi ma’lumotlarni navbat bilan yuboring:',
      '1) Ism-familiya',
      '2) Telefon raqam',
      '3) O‘quv markaz nomi',
      '4) Shahar',
      '5) O‘quvchilar soni',
      '',
      'Avval ism-familiyangizni yozing.'
    ].join('\n');
  }

  if (analysis.intent === 'crm_need') {
    return [
      'Tushundim. Sizga Eduka CRM mos keladi.',
      painText,
      '',
      'Eduka markazda quyidagilarni tartibga soladi:',
      '• talabalar va guruhlar',
      '• to‘lov va qarzdorlik',
      '• davomat va dars jadvali',
      '• Telegram avtomatik xabarlar',
      '• Student App va gamification',
      '',
      'Aniqroq maslahat berishim uchun nechta o‘quvchingiz bor?'
    ].filter(Boolean).join('\n');
  }

  if (analysis.intent === 'support_request') {
    return operatorText(config);
  }

  if (faq) {
    return `<b>${faq.title}</b>\n\n${faq.answer}\n\nAgar markazingiz bo‘yicha aniq tavsiya xohlasangiz, o‘quvchilar soni va asosiy muammoingizni yozing.`;
  }

  if (tags.size) {
    return [
      'Tushunarli, men sizning so‘rovingizni analiz qildim.',
      `Qiziqish: <b>${[...tags].join(', ')}</b>.`,
      `Lead darajasi: <b>${temp}</b>.`,
      '',
      'Eduka sizga CRM, to‘lov/davomat, Telegram xabarlar va Student App orqali yordam beradi.',
      '',
      'Aniq tavsiya uchun o‘quvchilar sonini va qaysi muammo eng muhimligini yozing.'
    ].join('\n');
  }

  return [
    'Savolingizni qabul qildim. Men Eduka bo‘yicha AI yordamchiman.',
    '',
    'Quyidagilardan birini yozishingiz mumkin:',
    '• narxlar',
    '• demo',
    '• imkoniyatlar',
    '• student app',
    '• to‘lov va davomat',
    '• operator'
  ].join('\n');
}

async function maybeCreateSmartLead(pool, conv, analysis, from) {
  const memory = conv.memory || {};
  const score = Number(conv.lead_score || 0);
  if (score < 75 && !analysis.entities.phone) return null;
  const existing = await pool.query(
    `SELECT * FROM ai_assistant_leads WHERE telegram_user_id=$1 AND created_at > NOW() - INTERVAL '14 days' ORDER BY created_at DESC LIMIT 1`,
    [String(conv.telegram_user_id)]
  );
  if (existing.rows[0]) {
    await pool.query(`UPDATE ai_assistant_leads SET score=$2, intent=$3, interest_tags=$4, ai_summary=$5, updated_at=NOW() WHERE id=$1`, [existing.rows[0].id, score, analysis.intent, conv.interest_tags || [], conv.summary || null]);
    return existing.rows[0];
  }
  const lead = await pool.query(
    `INSERT INTO ai_assistant_leads (chat_id, telegram_user_id, username, full_name, phone, center_name, city, student_count, notes, intent, score, interest_tags, ai_summary, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'new') RETURNING *`,
    [conv.chat_id, conv.telegram_user_id, from.username || null, memory.full_name || from.first_name || null, memory.phone || analysis.entities.phone || null, memory.center_name || analysis.entities.center_name || null, memory.city || analysis.entities.city || null, memory.student_count || analysis.entities.student_count || null, JSON.stringify(memory), analysis.intent, score, conv.interest_tags || analysis.tags || [], conv.summary || null]
  );
  return lead.rows[0];
}

function startText() {
  return [
    'Assalomu alaykum! Men <b>Eduka AI yordamchisi</b>man.',
    '',
    'Eduka — o‘quv markazlar uchun CRM, Student App, Parent App, Telegram bildirishnoma, to‘lov, davomat va gamification tizimiga ega platforma.',
    '',
    'Quyidagilardan birini tanlang:'
  ].join('\n');
}

function operatorText(config) {
  return `Savolingiz operatorga yuborilishi mumkin. Tezkor aloqa: ${config.supportUsername || '@eduka_admin'}\n\nDemo uchun “Demo ko‘rish” tugmasini bosing.`;
}

async function notifyAdmin(pool, config, lead) {
  if (!config.adminChatId || !config.enabled) return;
  const text = [
    '🟦 <b>Yangi Eduka demo so‘rovi</b>',
    '',
    `Ism: <b>${lead.full_name || '-'}</b>`,
    `Telefon: <b>${lead.phone || '-'}</b>`,
    `Markaz: ${lead.center_name || '-'}`,
    `Shahar: ${lead.city || '-'}`,
    `Talabalar soni: ${lead.student_count || '-'}`,
    lead.username ? `Telegram: @${lead.username}` : '',
    '',
    'Manba: @eduka_aibot'
  ].filter(Boolean).join('\n');
  try { await sendBotMessage(pool, config, config.adminChatId, text); } catch {}
}

function getMessageText(update) {
  if (update.message && typeof update.message.text === 'string') return update.message.text;
  if (update.business_message && typeof update.business_message.text === 'string') return update.business_message.text;
  if (update.edited_business_message && typeof update.edited_business_message.text === 'string') return update.edited_business_message.text;
  if (update.callback_query && update.callback_query.data) return update.callback_query.data;
  return '';
}

function getBusinessConnectionId(update) {
  return (update.business_message && update.business_message.business_connection_id)
    || (update.edited_business_message && update.edited_business_message.business_connection_id)
    || null;
}

async function upsertBusinessConnection(pool, update) {
  const bc = update && update.business_connection;
  if (!bc || !bc.id) return null;
  const user = bc.user || {};
  const result = await pool.query(
    `INSERT INTO ai_assistant_business_connections (business_connection_id, user_id, user_first_name, user_username, is_enabled, payload)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb)
     ON CONFLICT (business_connection_id) DO UPDATE SET
       user_id=EXCLUDED.user_id,
       user_first_name=EXCLUDED.user_first_name,
       user_username=EXCLUDED.user_username,
       is_enabled=EXCLUDED.is_enabled,
       payload=EXCLUDED.payload,
       updated_at=NOW()
     RETURNING *`,
    [String(bc.id), user.id ? String(user.id) : null, user.first_name || null, user.username || null, bc.is_enabled !== false, JSON.stringify(bc)]
  );
  return result.rows[0];
}

async function handleLeadStep(pool, config, conv, chatId, from, text, sendOptions = {}) {
  const draft = conv.draft || {};
  const clean = String(text || '').trim();

  if (clean === '/cancel') {
    await setConversationState(pool, conv.telegram_user_id, 'idle', {});
    await sendBotMessage(pool, config, chatId, 'Bekor qilindi. Asosiy menyuga qaytdik.' , mainMenuKeyboard());
    return;
  }

  if (conv.state === 'lead_name') {
    draft.full_name = clean;
    await setConversationState(pool, conv.telegram_user_id, 'lead_phone', draft);
    await sendBotMessage(pool, config, chatId, 'Telefon raqamingizni yuboring. Masalan: +998901234567', demoCancelKeyboard(), sendOptions);
    return;
  }

  if (conv.state === 'lead_phone') {
    draft.phone = clean;
    await setConversationState(pool, conv.telegram_user_id, 'lead_center', draft);
    await sendBotMessage(pool, config, chatId, 'O‘quv markazingiz nomini yozing.', demoCancelKeyboard(), sendOptions);
    return;
  }

  if (conv.state === 'lead_center') {
    draft.center_name = clean;
    await setConversationState(pool, conv.telegram_user_id, 'lead_city', draft);
    await sendBotMessage(pool, config, chatId, 'Qaysi shahardasiz?', demoCancelKeyboard(), sendOptions);
    return;
  }

  if (conv.state === 'lead_city') {
    draft.city = clean;
    await setConversationState(pool, conv.telegram_user_id, 'lead_students', draft);
    await sendBotMessage(pool, config, chatId, 'Taxminan nechta o‘quvchingiz bor?', demoCancelKeyboard(), sendOptions);
    return;
  }

  if (conv.state === 'lead_students') {
    draft.student_count = clean;
    const leadResult = await pool.query(
      `INSERT INTO ai_assistant_leads (chat_id, telegram_user_id, username, full_name, phone, center_name, city, student_count, notes, intent, score, interest_tags, ai_summary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [String(chatId), String(conv.telegram_user_id), from.username || null, draft.full_name || null, draft.phone || null, draft.center_name || null, draft.city || null, draft.student_count || null, JSON.stringify(draft), 'demo_request', Math.max(80, Number(conv.lead_score || 0)), conv.interest_tags || ['demo'], 'Demo form orqali qoldirilgan issiq lead']
    );
    await setConversationState(pool, conv.telegram_user_id, 'idle', {});
    await notifyAdmin(pool, config, leadResult.rows[0]);
    await sendBotMessage(pool, config, chatId, '✅ Demo so‘rovingiz qabul qilindi. Tez orada operator siz bilan bog‘lanadi.', finalLeadKeyboard(), sendOptions);
  }
}

async function processCommandOrText(pool, config, conv, chat, from, text, sendOptions = {}) {
  const chatId = chat.id;
  const input = String(text || '').trim();

  if (conv.state && conv.state.startsWith('lead_')) {
    await handleLeadStep(pool, config, conv, chatId, from, input, sendOptions);
    return;
  }

  const analysis = analyzeIntent(input, conv);
  let smartConv = await updateConversationIntelligence(pool, conv, analysis, input);
  await logMessage(pool, {
    chat_id: chatId,
    telegram_user_id: from.id || chat.id,
    direction: 'ai',
    message_type: 'intent_analysis',
    text: `intent=${analysis.intent}; score_delta=${analysis.score_delta}`,
    payload: { analysis, memory: smartConv.memory, score: smartConv.lead_score },
    business_connection_id: sendOptions.business_connection_id || null,
    is_business_message: Boolean(sendOptions.business_connection_id),
    intent: analysis.intent,
    confidence: analysis.confidence,
    lead_score_delta: analysis.score_delta,
    ai_reason: analysis
  });

  // Demo niyati juda aniq bo‘lsa, lead formni avtomatik boshlaymiz.
  if (analysis.intent === 'demo_request') {
    await setConversationState(pool, smartConv.telegram_user_id, 'lead_name', smartConv.memory || {});
    await sendBotMessage(pool, config, chatId, smartReplyText(config, smartConv, analysis), demoCancelKeyboard(), sendOptions);
    return;
  }

  const faq = await findFaq(pool, input);
  const reply = smartReplyText(config, smartConv, analysis, faq);
  const createdLead = await maybeCreateSmartLead(pool, smartConv, analysis, from);
  if (createdLead && Number(createdLead.score || 0) >= 75) {
    try { await notifyAdmin(pool, config, createdLead); } catch {}
  }
  await sendBotMessage(pool, config, chatId, reply, mainMenuKeyboard(), sendOptions);
}

async function processCallback(pool, config, conv, callback) {
  const data = callback.data || '';
  const chat = callback.message.chat;
  const chatId = chat.id;
  await answerCallback(config, callback.id);

  if (data === 'ai:menu') {
    await setConversationState(pool, conv.telegram_user_id, 'idle', {});
    await sendBotMessage(pool, config, chatId, startText(), mainMenuKeyboard());
    return;
  }
  if (data === 'ai:cancel') {
    await setConversationState(pool, conv.telegram_user_id, 'idle', {});
    await sendBotMessage(pool, config, chatId, 'Bekor qilindi.', mainMenuKeyboard());
    return;
  }
  if (data === 'ai:demo') {
    await setConversationState(pool, conv.telegram_user_id, 'lead_name', {});
    await sendBotMessage(pool, config, chatId, 'Demo ko‘rish uchun avval ism-familiyangizni yozing.', demoCancelKeyboard());
    return;
  }
  if (data === 'ai:operator') {
    await sendBotMessage(pool, config, chatId, operatorText(config), mainMenuKeyboard());
    if (config.adminChatId) {
      await sendBotMessage(pool, config, config.adminChatId, `Operator so‘rovi: ${conv.first_name || ''} ${conv.username ? '@' + conv.username : ''} (chat_id: ${chatId})`);
    }
    return;
  }

  const key = data.replace(/^ai:/, '');
  const result = await pool.query('SELECT * FROM ai_assistant_faqs WHERE key=$1 AND is_active=TRUE LIMIT 1', [key]);
  if (result.rows[0]) {
    const faq = result.rows[0];
    await sendBotMessage(pool, config, chatId, `<b>${faq.title}</b>\n\n${faq.answer}` , mainMenuKeyboard());
    return;
  }
  await sendBotMessage(pool, config, chatId, startText(), mainMenuKeyboard());
}

async function handleWebhook({ request, response, pool, sendJson, readJsonBody }) {
  const config = aiBotConfig();
  if (!config.enabled) {
    sendJson(response, 503, { ok: false, message: 'EDUKA_AI_BOT_TOKEN sozlanmagan yoki bot o‘chirilgan' });
    return;
  }
  if (config.webhookSecret) {
    const headerSecret = String(request.headers['x-telegram-bot-api-secret-token'] || '');
    if (headerSecret && headerSecret !== config.webhookSecret) {
      sendJson(response, 401, { ok: false, message: 'Invalid webhook secret' });
      return;
    }
  }

  await ensureAiAssistantSchema(pool);
  const update = await readJsonBody(request);
  try {
    if (update.business_message) console.log('AI BOT business_message received', { chat_id: update.business_message.chat && update.business_message.chat.id, business_connection_id: update.business_message.business_connection_id, text: update.business_message.text });
    if (update.message) console.log('AI BOT message received', { chat_id: update.message.chat && update.message.chat.id, text: update.message.text });
    if (update.business_connection) console.log('AI BOT business_connection update', { id: update.business_connection.id, enabled: update.business_connection.is_enabled });
  } catch {}

  if (update.business_connection) {
    const saved = await upsertBusinessConnection(pool, update);
    await logMessage(pool, {
      chat_id: saved && saved.user_id ? saved.user_id : '',
      telegram_user_id: saved && saved.user_id ? saved.user_id : '',
      direction: 'in',
      message_type: 'business_connection',
      text: update.business_connection.is_enabled === false ? 'Business connection disabled' : 'Business connection enabled',
      payload: update,
      business_connection_id: update.business_connection.id,
      is_business_message: true
    });
    sendJson(response, 200, { ok: true, business_connection: true });
    return;
  }

  if (update.deleted_business_messages) {
    await logMessage(pool, {
      chat_id: update.deleted_business_messages.chat && update.deleted_business_messages.chat.id,
      telegram_user_id: '',
      direction: 'in',
      message_type: 'deleted_business_messages',
      text: 'Business messages deleted',
      payload: update,
      business_connection_id: update.deleted_business_messages.business_connection_id || null,
      is_business_message: true
    });
    sendJson(response, 200, { ok: true, deleted_business_messages: true });
    return;
  }

  const businessConnectionId = getBusinessConnectionId(update);
  const activeMessage = update.message || update.business_message || update.edited_business_message || (update.callback_query && update.callback_query.message);
  const from = update.callback_query ? update.callback_query.from : activeMessage ? (activeMessage.from || activeMessage.chat) : null;
  const chat = activeMessage ? activeMessage.chat : null;
  if (!chat || !from) {
    await logMessage(pool, { chat_id: '', telegram_user_id: '', direction: 'in', message_type: 'ignored', text: '', payload: update, business_connection_id: businessConnectionId, is_business_message: Boolean(businessConnectionId) });
    sendJson(response, 200, { ok: true, ignored: true });
    return;
  }

  const conv = await getConversation(pool, from, chat, { business_connection_id: businessConnectionId });
  await logMessage(pool, {
    chat_id: chat.id,
    telegram_user_id: from.id || chat.id,
    direction: 'in',
    message_type: update.callback_query ? 'callback' : businessConnectionId ? (update.edited_business_message ? 'edited_business_text' : 'business_text') : 'text',
    text: getMessageText(update),
    payload: update,
    business_connection_id: businessConnectionId,
    business_message_id: activeMessage && activeMessage.message_id ? String(activeMessage.message_id) : null,
    is_business_message: Boolean(businessConnectionId)
  });

  try {
    if (update.callback_query) {
      await processCallback(pool, config, conv, update.callback_query);
    } else if (update.edited_business_message) {
      // Edited business messages are stored for audit. We do not answer again to avoid duplicate replies.
    } else {
      await processCommandOrText(pool, config, conv, chat, from, getMessageText(update), { business_connection_id: businessConnectionId });
    }
    sendJson(response, 200, { ok: true, business: Boolean(businessConnectionId) });
  } catch (error) {
    try { await sendBotMessage(pool, config, chat.id, 'Kutilmagan xatolik yuz berdi. Iltimos, keyinroq urinib ko‘ring.', mainMenuKeyboard(), { business_connection_id: businessConnectionId }); } catch {}
    sendJson(response, 200, { ok: true, handled_error: error.message, business: Boolean(businessConnectionId) });
  }
}

async function handleSetWebhook({ response, pool, sendJson }) {
  const config = aiBotConfig();
  if (!config.enabled) {
    sendJson(response, 400, { ok: false, message: 'EDUKA_AI_BOT_TOKEN sozlanmagan' });
    return;
  }
  await ensureAiAssistantSchema(pool);
  const payload = { url: config.webhookUrl, allowed_updates: ['message', 'callback_query', 'business_connection', 'business_message', 'edited_business_message', 'deleted_business_messages'] };
  if (config.webhookSecret) payload.secret_token = config.webhookSecret;
  const result = await telegramRequest(config.token, 'setWebhook', payload);
  sendJson(response, 200, { ok: true, webhook_url: config.webhookUrl, result });
}

async function handleWebhookInfo({ response, sendJson }) {
  const config = aiBotConfig();
  if (!config.enabled) {
    sendJson(response, 200, { ok: false, configured: false, username: config.username });
    return;
  }
  const result = await telegramRequest(config.token, 'getWebhookInfo', {});
  sendJson(response, 200, { ok: true, configured: true, username: config.username, expected_webhook_url: config.webhookUrl, result });
}


async function businessOverview(pool) {
  const [connections, businessMessages] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_enabled=TRUE)::int AS active FROM ai_assistant_business_connections`).catch(() => ({ rows: [{ total: 0, active: 0 }] })),
    pool.query(`SELECT COUNT(*)::int AS total FROM ai_assistant_messages WHERE is_business_message=TRUE AND created_at > NOW() - INTERVAL '24 hours'`).catch(() => ({ rows: [{ total: 0 }] }))
  ]);
  return { connections: connections.rows[0], business_messages_24h: businessMessages.rows[0].total };
}

async function handleAdminApi({ request, response, pool, sendJson, readJsonBody, urlPath, query }) {
  await ensureAiAssistantSchema(pool);

  if (request.method === 'GET' && urlPath === '/api/app/ai-assistant/overview') {
    const [leads, messages, faqs] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='new')::int AS new_count FROM ai_assistant_leads`),
      pool.query(`SELECT COUNT(*)::int AS total FROM ai_assistant_messages WHERE created_at > NOW() - INTERVAL '24 hours'`),
      pool.query(`SELECT COUNT(*)::int AS total FROM ai_assistant_faqs WHERE is_active=TRUE`)
    ]);
    sendJson(response, 200, { ok: true, config: { ...aiBotConfig(), token: undefined }, leads: leads.rows[0], messages_24h: messages.rows[0].total, faq_count: faqs.rows[0].total, business: await businessOverview(pool) });
    return true;
  }

  if (request.method === 'GET' && urlPath === '/api/app/ai-assistant/leads') {
    const result = await pool.query(`SELECT * FROM ai_assistant_leads ORDER BY created_at DESC LIMIT 100`);
    sendJson(response, 200, { ok: true, leads: result.rows });
    return true;
  }

  if (request.method === 'GET' && urlPath === '/api/app/ai-assistant/messages') {
    const result = await pool.query(`SELECT * FROM ai_assistant_messages ORDER BY created_at DESC LIMIT 150`);
    sendJson(response, 200, { ok: true, messages: result.rows });
    return true;
  }

  if (request.method === 'GET' && urlPath === '/api/app/ai-assistant/faqs') {
    const result = await pool.query(`SELECT * FROM ai_assistant_faqs ORDER BY sort_order ASC, id ASC`);
    sendJson(response, 200, { ok: true, faqs: result.rows });
    return true;
  }

  if (request.method === 'POST' && urlPath === '/api/app/ai-assistant/faqs') {
    const body = await readJsonBody(request);
    const result = await pool.query(
      `INSERT INTO ai_assistant_faqs (key, title, keywords, answer, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [body.key || null, body.title, body.keywords || [], body.answer, Number(body.sort_order || 100), body.is_active !== false]
    );
    sendJson(response, 201, { ok: true, faq: result.rows[0] });
    return true;
  }


  if (request.method === 'GET' && urlPath === '/api/app/ai-assistant/business-connections') {
    const result = await pool.query(`SELECT * FROM ai_assistant_business_connections ORDER BY updated_at DESC LIMIT 100`);
    sendJson(response, 200, { ok: true, connections: result.rows });
    return true;
  }

  if (request.method === 'GET' && urlPath === '/api/app/ai-assistant/business-messages') {
    const result = await pool.query(`SELECT * FROM ai_assistant_messages WHERE is_business_message=TRUE ORDER BY created_at DESC LIMIT 200`);
    sendJson(response, 200, { ok: true, messages: result.rows });
    return true;
  }


  if (request.method === 'GET' && urlPath === '/api/app/ai-assistant/intelligence') {
    const [intents, hotLeads, conversations] = await Promise.all([
      pool.query(`SELECT intent, COUNT(*)::int AS total, ROUND(AVG(confidence)::numeric,2) AS avg_confidence FROM ai_assistant_intent_logs WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY intent ORDER BY total DESC LIMIT 20`).catch(() => ({ rows: [] })),
      pool.query(`SELECT * FROM ai_assistant_conversations WHERE lead_score >= 60 ORDER BY lead_score DESC, updated_at DESC LIMIT 50`).catch(() => ({ rows: [] })),
      pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE qualified=TRUE)::int AS qualified, ROUND(AVG(lead_score)::numeric,1) AS avg_score FROM ai_assistant_conversations`).catch(() => ({ rows: [{ total: 0, qualified: 0, avg_score: 0 }] }))
    ]);
    sendJson(response, 200, { ok: true, intents: intents.rows, hot_leads: hotLeads.rows, conversations: conversations.rows[0] });
    return true;
  }

  if (request.method === 'GET' && urlPath === '/api/app/ai-assistant/conversations') {
    const result = await pool.query(`SELECT * FROM ai_assistant_conversations ORDER BY lead_score DESC, updated_at DESC LIMIT 150`);
    sendJson(response, 200, { ok: true, conversations: result.rows });
    return true;
  }

  const leadStatusMatch = urlPath.match(/^\/api\/app\/ai-assistant\/leads\/(\d+)\/status$/);
  if (request.method === 'POST' && leadStatusMatch) {
    const body = await readJsonBody(request);
    const result = await pool.query(`UPDATE ai_assistant_leads SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING *`, [Number(leadStatusMatch[1]), body.status || 'contacted']);
    sendJson(response, 200, { ok: true, lead: result.rows[0] });
    return true;
  }

  sendJson(response, 404, { ok: false, message: 'AI Assistant endpoint topilmadi' });
  return true;
}

module.exports = {
  aiBotConfig,
  ensureAiAssistantSchema,
  handleWebhook,
  handleSetWebhook,
  handleWebhookInfo,
  handleAdminApi
};
