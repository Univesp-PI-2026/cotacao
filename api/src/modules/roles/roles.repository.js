const pool = require("../../db");

const roleSelect = `
  SELECT
    r.id,
    r.name,
    r.created_at,
    r.updated_at,
    COUNT(u.id) AS users_count
  FROM roles r
  LEFT JOIN users u ON u.role_id = r.id
`;

async function findAll() {
  const [rows] = await pool.query(
    `${roleSelect}
    GROUP BY r.id, r.name, r.created_at, r.updated_at
    ORDER BY r.name ASC`
  );

  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    `${roleSelect}
    WHERE r.id = ?
    GROUP BY r.id, r.name, r.created_at, r.updated_at
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function create(data) {
  const [result] = await pool.query(
    "INSERT INTO roles (name) VALUES (?)",
    [data.name]
  );

  return result.insertId;
}

async function update(id, data) {
  await pool.query(
    "UPDATE roles SET name = ? WHERE id = ?",
    [data.name, id]
  );
}

async function remove(id) {
  await pool.query("DELETE FROM roles WHERE id = ?", [id]);
}

async function countUsersByRoleId(roleId) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS total FROM users WHERE role_id = ?",
    [roleId]
  );

  return rows[0].total;
}

module.exports = {
  countUsersByRoleId,
  create,
  findAll,
  findById,
  remove,
  update
};
