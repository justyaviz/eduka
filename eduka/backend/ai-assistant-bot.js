const https = require('https');

const DEFAULT_FAQS = [
  {
    key: 'about',
    title: 'Eduka nima?',
    keywords: ['eduka', 'nima', 'crm', 'platforma', 'haqida'],
    answer: 'Eduka — o‘quv markazlar uchun CRM, Student App, Parent App, Telegram bildirishnomalar, to‘lov, davomat, gamification va hisobotlarni bir joyda boshqaradigan SaaS platforma.'
  },
  {
    key: 'features',
    title: 'Imkoniyatlar',
    keywords: ['imkoniyat', 'funksiya', 'nimalar', 'modul'],
    answer: 'Eduka imkoniyatlari: talabalar, guruhlar, o‘qituvchilar, dars jadvali, davomat, to‘lovlar, qarzdorlik, chek/QR, Telegram xabar, Student App, Parent App, coin/rewards, hisobotlar va CEO SaaS boshqaruvi.'
  },
  {
    key: 'pricing',
    title: 'Narxlar',
    keywords: ['narx', 'tarif', 'qancha', 'to‘lov', 'tolov', 'price'],
    answer: 'Eduka tariflari markaz hajmiga qarab Start, Pro, Business va Enterprise shaklida sozlanadi. Aniq narx uchun demo so‘rov qoldiring — sizga mos paket tavsiya qilamiz.'
  },
  {
    key: 'student_app',
    title: 'Student App',
    keywords: ['student app', 'o‘quvchi app', 'student', 'ilova'],
    answer: 'Student App orqali o‘quvchi dars jadvali, to‘lov holati, davomat, coin, sovg‘alar, reyting, yutuqlar, materiallar, uyga vazifa va bildirishnomalarni ko‘radi.'
  },
  {
    key: 'parent_app',
    title: 'Parent App',
    keywords: ['parent', 'ota-ona', 'ota ona', 'farzand'],
    answer: 'Parent App ota-onaga farzandining jadvali, to‘lov holati, qarzdorligi, davomati, vazifalari va bildirishnomalarini ko‘rsatish uchun rejalangan modul.'
  },
  {
    key: 'telegram',
    title: 'Telegram xabarlar',
    keywords: ['telegram', 'bot', 'xabar', 'sms', 'notification'],
    answer: 'Eduka Telegram bot orqali to‘lov, coin, sovg‘a statusi, davomat, dars eslatmasi, qarzdorlik va uyga vazifa xabarlarini yubora oladi.'
  },
  {
    key: 'demo',
    title: 'Demo olish',
    keywords: ['demo', 'ko‘rish', 'korish', 'sinab', 'ulanish'],
    answer: 'Demo olish uchun “Demo so‘rash” tugmasini bosing. Ism, telefon, markaz nomi, shahar va talabalar sonini qoldirsangiz, operator siz bilan bog‘lanadi.'
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
    CREATE INDEX IF NOT EXISTS idx_ai_assistant_messages_chat ON ai_assistant_messages(chat_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_assistant_leads_status ON ai_assistant_leads(status, created_at DESC);
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
    `INSERT INTO ai_assistant_messages (chat_id, telegram_user_id, direction, message_type, text, payload) VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
    [String(data.chat_id || ''), String(data.telegram_user_id || ''), data.direction, data.message_type || 'text', data.text || '', JSON.stringify(data.payload || {})]
  );
}

async function getConversation(pool, from, chat) {
  const userId = String(from && from.id ? from.id : chat.id);
  const chatId = String(chat.id);
  const username = from && from.username ? String(from.username) : null;
  const firstName = from && from.first_name ? String(from.first_name) : null;
  const result = await pool.query(
    `INSERT INTO ai_assistant_conversations (telegram_user_id, chat_id, username, first_name)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (telegram_user_id) DO UPDATE SET chat_id=EXCLUDED.chat_id, username=EXCLUDED.username, first_name=EXCLUDED.first_name, updated_at=NOW()
     RETURNING *`,
    [userId, chatId, username, firstName]
  );
  return result.rows[0];
}

async function setConversationState(pool, telegramUserId, state, draft = {}) {
  await pool.query(
    `UPDATE ai_assistant_conversations SET state=$2, draft=$3::jsonb, updated_at=NOW() WHERE telegram_user_id=$1`,
    [String(telegramUserId), state, JSON.stringify(draft || {})]
  );
}

async function sendBotMessage(pool, config, chatId, text, replyMarkup) {
  if (!config.enabled) return { ok: false, skipped: true };
  const payload = { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  const result = await telegramRequest(config.token, 'sendMessage', payload);
  await logMessage(pool, { chat_id: chatId, direction: 'out', message_type: 'text', text, payload: { reply_markup: replyMarkup || null } });
  return result;
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
  if (update.callback_query && update.callback_query.data) return update.callback_query.data;
  return '';
}

async function handleLeadStep(pool, config, conv, chatId, from, text) {
  const draft = conv.draft || {};
  const clean = String(text || '').trim();

  if (clean === '/cancel') {
    await setConversationState(pool, conv.telegram_user_id, 'idle', {});
    await sendBotMessage(pool, config, chatId, 'Bekor qilindi. Asosiy menyuga qaytdik.', mainMenuKeyboard());
    return;
  }

  if (conv.state === 'lead_name') {
    draft.full_name = clean;
    await setConversationState(pool, conv.telegram_user_id, 'lead_phone', draft);
    await sendBotMessage(pool, config, chatId, 'Telefon raqamingizni yuboring. Masalan: +998901234567', demoCancelKeyboard());
    return;
  }

  if (conv.state === 'lead_phone') {
    draft.phone = clean;
    await setConversationState(pool, conv.telegram_user_id, 'lead_center', draft);
    await sendBotMessage(pool, config, chatId, 'O‘quv markazingiz nomini yozing.', demoCancelKeyboard());
    return;
  }

  if (conv.state === 'lead_center') {
    draft.center_name = clean;
    await setConversationState(pool, conv.telegram_user_id, 'lead_city', draft);
    await sendBotMessage(pool, config, chatId, 'Qaysi shahardasiz?', demoCancelKeyboard());
    return;
  }

  if (conv.state === 'lead_city') {
    draft.city = clean;
    await setConversationState(pool, conv.telegram_user_id, 'lead_students', draft);
    await sendBotMessage(pool, config, chatId, 'Taxminan nechta o‘quvchingiz bor?', demoCancelKeyboard());
    return;
  }

  if (conv.state === 'lead_students') {
    draft.student_count = clean;
    const leadResult = await pool.query(
      `INSERT INTO ai_assistant_leads (chat_id, telegram_user_id, username, full_name, phone, center_name, city, student_count, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [String(chatId), String(conv.telegram_user_id), from.username || null, draft.full_name || null, draft.phone || null, draft.center_name || null, draft.city || null, draft.student_count || null, JSON.stringify(draft)]
    );
    await setConversationState(pool, conv.telegram_user_id, 'idle', {});
    await notifyAdmin(pool, config, leadResult.rows[0]);
    await sendBotMessage(pool, config, chatId, '✅ Demo so‘rovingiz qabul qilindi. Tez orada operator siz bilan bog‘lanadi.', finalLeadKeyboard());
  }
}

async function processCommandOrText(pool, config, conv, chat, from, text) {
  const chatId = chat.id;
  const input = String(text || '').trim();

  if (conv.state && conv.state.startsWith('lead_')) {
    await handleLeadStep(pool, config, conv, chatId, from, input);
    return;
  }

  if (input === '/start' || input === '/menu') {
    await setConversationState(pool, conv.telegram_user_id, 'idle', {});
    await sendBotMessage(pool, config, chatId, startText(), mainMenuKeyboard());
    return;
  }

  const faq = await findFaq(pool, input);
  if (faq) {
    await sendBotMessage(pool, config, chatId, `<b>${faq.title}</b>\n\n${faq.answer}`, mainMenuKeyboard());
    return;
  }

  await sendBotMessage(pool, config, chatId, [
    'Savolingizni tushundim. Hozircha men Eduka haqida tayyor ma’lumotlar asosida javob beraman.',
    '',
    'Quyidagi bo‘limlardan birini tanlang yoki demo so‘rov qoldiring.'
  ].join('\n'), mainMenuKeyboard());
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
    await sendBotMessage(pool, config, chatId, `<b>${faq.title}</b>\n\n${faq.answer}`, mainMenuKeyboard());
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
  const message = update.message || (update.callback_query && update.callback_query.message);
  const from = update.callback_query ? update.callback_query.from : update.message ? update.message.from : null;
  const chat = message ? message.chat : null;
  if (!chat || !from) {
    sendJson(response, 200, { ok: true, ignored: true });
    return;
  }

  const conv = await getConversation(pool, from, chat);
  await logMessage(pool, { chat_id: chat.id, telegram_user_id: from.id, direction: 'in', message_type: update.callback_query ? 'callback' : 'text', text: getMessageText(update), payload: update });

  try {
    if (update.callback_query) {
      await processCallback(pool, config, conv, update.callback_query);
    } else {
      await processCommandOrText(pool, config, conv, chat, from, update.message.text || '');
    }
    sendJson(response, 200, { ok: true });
  } catch (error) {
    try { await sendBotMessage(pool, config, chat.id, 'Kutilmagan xatolik yuz berdi. Iltimos, keyinroq urinib ko‘ring.', mainMenuKeyboard()); } catch {}
    sendJson(response, 200, { ok: true, handled_error: error.message });
  }
}

async function handleSetWebhook({ response, pool, sendJson }) {
  const config = aiBotConfig();
  if (!config.enabled) {
    sendJson(response, 400, { ok: false, message: 'EDUKA_AI_BOT_TOKEN sozlanmagan' });
    return;
  }
  await ensureAiAssistantSchema(pool);
  const payload = { url: config.webhookUrl, allowed_updates: ['message', 'callback_query'] };
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

async function handleAdminApi({ request, response, pool, sendJson, readJsonBody, urlPath, query }) {
  await ensureAiAssistantSchema(pool);

  if (request.method === 'GET' && urlPath === '/api/app/ai-assistant/overview') {
    const [leads, messages, faqs] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='new')::int AS new_count FROM ai_assistant_leads`),
      pool.query(`SELECT COUNT(*)::int AS total FROM ai_assistant_messages WHERE created_at > NOW() - INTERVAL '24 hours'`),
      pool.query(`SELECT COUNT(*)::int AS total FROM ai_assistant_faqs WHERE is_active=TRUE`)
    ]);
    sendJson(response, 200, { ok: true, config: { ...aiBotConfig(), token: undefined }, leads: leads.rows[0], messages_24h: messages.rows[0].total, faq_count: faqs.rows[0].total });
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
