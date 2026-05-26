const fs = require('fs');
const path = require('path');
const publicDir = path.join(__dirname, '..', 'public');
const required = ['index.html', 'style.css', 'script.js'];
for (const file of required) {
  const full = path.join(publicDir, file);
  if (!fs.existsSync(full)) {
    console.error(`Missing ${file}`);
    process.exit(1);
  }
}
console.log('Build OK: static Eduka landing is ready.');
