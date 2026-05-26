const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL kiritilmagan');
  process.exit(1);
}
const outDir = path.join(process.cwd(), 'backups');
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(outDir, `eduka-backup-${stamp}.sql`);
const result = spawnSync('pg_dump', [databaseUrl, '--no-owner', '--no-privileges', '--file', out], { stdio: 'inherit' });
if (result.error) {
  console.error('pg_dump topilmadi yoki ishga tushmadi. Lokal kompyuterda PostgreSQL client o‘rnatilgan bo‘lishi kerak.');
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status);
console.log(`Backup tayyor: ${out}`);
