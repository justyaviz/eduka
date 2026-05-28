const { Pool } = require("pg");

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL is missing");
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });

    pool.on("connect", () => console.log("✅ Postgres connected"));
    pool.on("error", (error) => console.error("❌ Postgres pool error:", error.message));
  }

  return pool;
}

module.exports = getPool();
