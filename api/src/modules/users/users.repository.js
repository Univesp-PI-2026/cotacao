const pool = require("../../db");

const baseSelect = `
  SELECT
    u.id,
    u.role_id,
    r.name AS role_name,
    u.name,
    u.username,
    u.email,
    u.email_verified_at,
    u.active,
    u.created_at,
    u.updated_at
  FROM users u
  LEFT JOIN roles r ON r.id = u.role_id
`;

async function findAll(filters = {}) {
  let sql = baseSelect;
  const clauses = [];
  const params = [];

  if (filters.active === 0 || filters.active === 1) {
    clauses.push("u.active = ?");
    params.push(filters.active);
  }

  if (filters.role_id) {
    clauses.push("u.role_id = ?");
    params.push(filters.role_id);
  }

  if (clauses.length > 0) {
    sql += ` WHERE ${clauses.join(" AND ")}`;
  }

  sql += " ORDER BY u.name ASC";

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function count(filters = {}) {
  let sql = `
    SELECT COUNT(*) AS total
    FROM users u
  `;
  const clauses = [];
  const params = [];

  if (filters.active === 0 || filters.active === 1) {
    clauses.push("u.active = ?");
    params.push(filters.active);
  }

  if (filters.role_id) {
    clauses.push("u.role_id = ?");
    params.push(filters.role_id);
  }

  if (clauses.length > 0) {
    sql += ` WHERE ${clauses.join(" AND ")}`;
  }

  const [rows] = await pool.query(sql, params);
  return rows[0].total;
}

async function findById(id) {
  const [rows] = await pool.query(
    `${baseSelect} WHERE u.id = ? LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function roleExists(roleId) {
  const [rows] = await pool.query(
    "SELECT id FROM roles WHERE id = ? LIMIT 1",
    [roleId]
  );

  return rows.length > 0;
}

async function findRoleById(roleId) {
  const [rows] = await pool.query(
    "SELECT id, name FROM roles WHERE id = ? LIMIT 1",
    [roleId]
  );

  return rows[0] || null;
}

async function countActiveAdmins(excludeUserId) {
  let sql = `
    SELECT COUNT(*) AS total
    FROM users u
    INNER JOIN roles r ON r.id = u.role_id
    WHERE r.name = 'admin' AND u.active = 1
  `;
  const params = [];

  if (excludeUserId) {
    sql += " AND u.id <> ?";
    params.push(excludeUserId);
  }

  const [rows] = await pool.query(sql, params);
  return rows[0].total;
}

async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO users
    (role_id, name, username, email, password, active)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [data.role_id, data.name, data.username, data.email, data.password, data.active]
  );

  return result.insertId;
}

async function update(id, data) {
  if (data.password) {
    await pool.query(
      `UPDATE users
      SET role_id = ?, name = ?, username = ?, email = ?, password = ?, active = ?
      WHERE id = ?`,
      [data.role_id, data.name, data.username, data.email, data.password, data.active, id]
    );
    return;
  }

  await pool.query(
    `UPDATE users
    SET role_id = ?, name = ?, username = ?, email = ?, active = ?
    WHERE id = ?`,
    [data.role_id, data.name, data.username, data.email, data.active, id]
  );
}

async function updateActiveStatus(id, active) {
  const [result] = await pool.query(
    "UPDATE users SET active = ? WHERE id = ?",
    [active, id]
  );

  return result.affectedRows;
}

module.exports = {
  countActiveAdmins,
  count,
  create,
  findAll,
  findById,
  findRoleById,
  roleExists,
  update,
  updateActiveStatus
};
