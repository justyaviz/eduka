const required = [
  'DATABASE_URL',
  'SUPER_ADMIN_EMAIL',
  'SUPER_ADMIN_PASSWORD',
  'STUDENT_APP_SESSION_SECRET',
  'TELEGRAM_WEBHOOK_SECRET'
];
const weakPasswords = new Set(['owner', 'admin', 'password', '123456', '12345678', 'qwerty']);
const errors = [];
const warnings = [];
for (const key of required) {
  if (!String(process.env[key] || '').trim()) errors.push(`${key} kiritilmagan`);
}
const password = String(process.env.SUPER_ADMIN_PASSWORD || '');
if (password && (password.length < 16 || weakPasswords.has(password.toLowerCase()))) {
  errors.push('SUPER_ADMIN_PASSWORD kamida 16 belgili kuchli parol bo‘lishi kerak');
}
if (String(process.env.EDUKA_ALLOW_OWNER_RESET || '0') === '1') {
  errors.push('EDUKA_ALLOW_OWNER_RESET=1 production uchun xavfli: tenant data o‘chishi mumkin');
}
if (String(process.env.ASSET_UPLOAD_FALLBACK || 'off').toLowerCase() !== 'off') {
  warnings.push('ASSET_UPLOAD_FALLBACK off emas. Production’da rasmlarni DB ichida saqlash tavsiya qilinmaydi');
}
if (!process.env.GITHUB_ASSETS_TOKEN || !process.env.GITHUB_ASSETS_REPO) {
  warnings.push('GITHUB_ASSETS_TOKEN/GITHUB_ASSETS_REPO yo‘q. Rasm upload production’da ishlamasligi mumkin');
}
if (process.env.NODE_ENV !== 'production') warnings.push('NODE_ENV production emas');
if (errors.length) {
  console.error('Eduka production check FAILED');
  for (const e of errors) console.error(`- ${e}`);
  if (warnings.length) {
    console.warn('\nWarnings:');
    for (const w of warnings) console.warn(`- ${w}`);
  }
  process.exit(1);
}
console.log('Eduka production check OK');
if (warnings.length) {
  console.warn('Warnings:');
  for (const w of warnings) console.warn(`- ${w}`);
}
