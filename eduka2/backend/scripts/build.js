const fs = require('fs');
const path = require('path');
const index = path.join(__dirname, '..', '..', 'public', 'index.html');
if (!fs.existsSync(index)) { console.error('Build failed: ../public/index.html not found'); process.exit(1); }
console.log('EDUKA 2.0 backend-root build OK');
