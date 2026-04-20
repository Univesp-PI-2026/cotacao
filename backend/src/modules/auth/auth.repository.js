const pool = require("../../db");

async function findUserForLogin(identifier) {
  const [rows] = await pool.query(
    `SELECT
      u.id,
      u.role_id,
      r.name AS role_name,
      u.name,
      u.username,
      u.email,
      u.password,
      u.active,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE u.email = ? OR u.username = ?
    LIMIT 1`,
    [identifier, identifier]
  );

  return rows[0] || null;
}

module.exports = {
  findUserForLogin
};
