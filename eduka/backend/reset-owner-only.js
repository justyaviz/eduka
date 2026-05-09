const { Pool } = require("pg");
const { execFileSync } = require("child_process");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not configured");
  process.exit(1);
}

// Reuse the official migration. It now includes owner-only cleanup and owner seed.
try {
  execFileSync(process.execPath, [require.resolve("./migrate.js")], { stdio: "inherit", env: process.env });
} catch (error) {
  process.exit(error.status || 1);
}
