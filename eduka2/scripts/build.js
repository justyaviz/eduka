const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const index = path.join(publicDir, 'index.html');
if (!fs.existsSync(index)) {
  console.error('Build failed: public/index.html not found');
  process.exit(1);
}
console.log('EDUKA 2.0 build OK');
console.log('Static files ready:', publicDir);
