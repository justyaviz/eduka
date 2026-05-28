const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});
pool.on("connect", () => console.log("Postgres connected"));
pool.on("error", (error) => console.error("Postgres error:", error));
module.exports = pool;
