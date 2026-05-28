const { Pool } = require("pg");

let activePool = null;
let activeInfo = null;
let resolvingPromise = null;

function maskUrl(url) {
  if (!url) return null;
  return String(url).replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
}

function normalizeUrl(raw) {
  if (!raw) return null;
  let url = String(raw).trim();

  // Railway variable reference noto'g'ri literal bo'lib qolgan bo'lsa
  if (url.includes("${{") || url.includes("}}")) return null;

  if (url.startsWith("postgres://")) {
    url = url.replace("postgres://", "postgresql://");
  }

  return url;
}

function candidateUrls() {
  const keys = [
    "DATABASE_URL",
    "DATABASE_PRIVATE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRIVATE_URL",
    "POSTGRES_DATABASE_URL",
    "PGDATABASE_URL",
    "RAILWAY_DATABASE_URL"
  ];

  const urls = [];

  for (const key of keys) {
    const value = normalizeUrl(process.env[key]);
    if (value) urls.push({ key, url: value });
  }

  // Railway Postgres ba'zida alohida PG* env beradi
  const host = process.env.PGHOST || process.env.POSTGRES_HOST;
  const port = process.env.PGPORT || process.env.POSTGRES_PORT || "5432";
  const user = process.env.PGUSER || process.env.POSTGRES_USER || "postgres";
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE || process.env.POSTGRES_DB || "railway";

  if (host && password) {
    urls.push({
      key: "PGHOST/PGUSER/PGPASSWORD/PGDATABASE",
      url: `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
    });
  }

  const unique = [];
  const seen = new Set();

  for (const item of urls) {
    if (!seen.has(item.url)) {
      seen.add(item.url);
      unique.push(item);
    }
  }

  return unique;
}

async function testPool(item) {
  const pool = new Pool({
    connectionString: item.url,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    await pool.query("SELECT 1 AS ok");
    pool.on("connect", () => console.log(`✅ Postgres connected via ${item.key}`));
    pool.on("error", (error) => console.error("❌ Postgres pool error:", error.message));
    return pool;
  } catch (error) {
    await pool.end().catch(() => {});
    throw error;
  }
}

async function resolvePool() {
  if (activePool) return activePool;
  if (resolvingPromise) return resolvingPromise;

  resolvingPromise = (async () => {
    const candidates = candidateUrls();

    if (!candidates.length) {
      const error = new Error("No Postgres URL found. Set DATABASE_URL or POSTGRES_URL.");
      error.code = "NO_DATABASE_URL";
      throw error;
    }

    const errors = [];

    for (const item of candidates) {
      try {
        console.log(`🔎 Trying Postgres URL from ${item.key}: ${maskUrl(item.url)}`);
        const pool = await testPool(item);
        activePool = pool;
        activeInfo = {
          key: item.key,
          maskedUrl: maskUrl(item.url),
        };
        console.log(`✅ Active Postgres URL: ${activeInfo.key}`);
        return activePool;
      } catch (error) {
        errors.push({
          key: item.key,
          maskedUrl: maskUrl(item.url),
          error: error.message,
          code: error.code || null,
        });
        console.error(`❌ Postgres candidate failed (${item.key}):`, error.message);
      }
    }

    const error = new Error(errors.map(e => `${e.key}: ${e.error}`).join(" | "));
    error.code = "ALL_DATABASE_URLS_FAILED";
    error.candidates = errors;
    throw error;
  })();

  try {
    return await resolvingPromise;
  } finally {
    resolvingPromise = null;
  }
}

async function query(...args) {
  const pool = await resolvePool();
  return pool.query(...args);
}

async function connect() {
  const pool = await resolvePool();
  return pool.connect();
}

async function end() {
  if (activePool) {
    await activePool.end();
    activePool = null;
    activeInfo = null;
  }
}

function getActiveInfo() {
  return activeInfo;
}

function getCandidatesInfo() {
  return candidateUrls().map(x => ({
    key: x.key,
    maskedUrl: maskUrl(x.url),
  }));
}

module.exports = {
  query,
  connect,
  end,
  getActiveInfo,
  getCandidatesInfo,
  resolvePool,
};
