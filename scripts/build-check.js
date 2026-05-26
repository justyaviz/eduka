const fs = require('fs');
const required = ['server.js','public/index.html','public/css/app.css','public/js/app.js'];
let ok = true;
for (const file of required) {
  if (!fs.existsSync(file)) { console.error(`Missing ${file}`); ok = false; }
}
if (!ok) process.exit(1);
console.log('Eduka 2.0 build check OK');
