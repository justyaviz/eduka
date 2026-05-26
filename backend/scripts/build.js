const fs = require('fs');
const required = ['server.js', 'public/index.html'];
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    process.exit(1);
  }
}
console.log('Build OK: static Eduka landing is ready.');
