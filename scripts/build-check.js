const fs = require('fs');
const path = require('path');

const required = [
  'server.js',
  'public/index.html',
  'public/css/app.css',
  'public/js/app.js',
  'railway.json'
];

for (const file of required) {
  const full = path.join(__dirname, '..', file);
  if (!fs.existsSync(full)) {
    console.error(`Missing required file: ${file}`);
    process.exit(1);
  }
}

const js = fs.readFileSync(path.join(__dirname, '..', 'public/js/app.js'), 'utf8');
new Function(js);
console.log('Eduka 2.0 build check passed.');
