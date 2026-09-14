const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const required = [
  'server.js', 'db.js', 'routes/api.js', 'routes/center-api.js', 'routes/tenant-api.js',
  'middleware/auth.js', 'middleware/center-auth.js', 'utils/init-db.js',
  'public/app/app.js', 'public/ceo/ceo.js'
];
for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`);
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', full], { stdio: 'inherit' });
}
console.log('Syntax check passed.');
