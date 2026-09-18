const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const publicDir = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(publicDir, 'crm/index.html'), 'utf8');
const assets = [...html.matchAll(/(?:src|href)="(\/crm\/assets\/[^"?#]+)"/g)].map(m => m[1]);
assert(assets.some(p => p.endsWith('.js')), 'CRM JavaScript entry is missing');
for (const asset of assets) assert(fs.existsSync(path.join(publicDir, asset)), `Missing CRM asset: ${asset}`);
console.log('CRM HTML and bundled assets match.');
