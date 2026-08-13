// Postgres connection for Ledger's database (M10 database assessment).
require("dotenv").config();
const { Pool } = require("pg");

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env and fill it in.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
