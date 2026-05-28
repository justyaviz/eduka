require("dotenv").config();
const { initDatabase } = require("../utils/init-db");
const pool = require("../db");

initDatabase()
  .then(async (result) => {
    console.log(result);
    await pool.end();
    process.exit(result.ok ? 0 : 1);
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
