const pool = require("../../db");

const roleSelect = `
  SELECT
    r.id,
    r.name,
    r.active,
    r.created_at,
    r.updated_at,
    COUNT(u.id) AS users_count
  FROM roles r
  LEFT JOIN users u ON u.role_id = r.id
`;

async function findAll(filters = {}) {
  let sql = roleSelect;
  const params = [];

  if (filters.active === 0 || filters.active === 1) {
    sql += " WHERE r.active = ?";
    params.push(filters.active);
  }

  const [rows] = await pool.query(
    `${sql}
    GROUP BY r.id, r.name, r.active, r.created_at, r.updated_at
    ORDER BY r.name ASC`,
    params
  );

  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    `${roleSelect}
    WHERE r.id = ?
    GROUP BY r.id, r.name, r.active, r.created_at, r.updated_at
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function create(data) {
  const [result] = await pool.query(
    "INSERT INTO roles (name, active) VALUES (?, ?)",
    [data.name, data.active]
  );

  return result.insertId;
}

async function update(id, data) {
  await pool.query(
    "UPDATE roles SET name = ?, active = ? WHERE id = ?",
    [data.name, data.active, id]
  );
}

async function updateActiveStatus(id, active) {
  const [result] = await pool.query(
    "UPDATE roles SET active = ? WHERE id = ?",
    [active, id]
  );

  return result.affectedRows;
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
  update,
  updateActiveStatus
};
