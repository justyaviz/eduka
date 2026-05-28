require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "migrations", "001_init.sql"), "utf8");
  await pool.query(sql);
  console.log("Migration completed");
  await pool.end();
}
migrate().catch((error)=>{ console.error(error); process.exit(1); });
