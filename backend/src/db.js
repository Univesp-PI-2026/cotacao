const mysql = require("mysql2/promise");

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "db",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "cotacao_user",
      password: process.env.DB_PASSWORD || "cotacao_pass",
      database: process.env.DB_NAME || "cotacao_v02",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  return pool;
}

async function query(sql, params) {
  return getPool().query(sql, params);
}

async function execute(sql, params) {
  return getPool().execute(sql, params);
}

async function end() {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
}

module.exports = {
  end,
  execute,
  getPool,
  query
};
