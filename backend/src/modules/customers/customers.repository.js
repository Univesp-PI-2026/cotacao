const pool = require("../../db");

const customerColumns = `
  id,
  name,
  email,
  is_foreign,
  cpf,
  rnm,
  birth_date,
  zip_code,
  street,
  number,
  complement,
  district,
  city,
  state,
  active,
  created_at,
  updated_at
`;

async function findAll(filters = {}) {
  let sql = `
    SELECT
      ${customerColumns}
    FROM customers
  `;
  const params = [];

  if (filters.active === 0 || filters.active === 1) {
    sql += " WHERE active = ?";
    params.push(filters.active);
  }

  sql += " ORDER BY id DESC";

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function count(filters = {}) {
  let sql = "SELECT COUNT(*) AS total FROM customers";
  const params = [];

  if (filters.active === 0 || filters.active === 1) {
    sql += " WHERE active = ?";
    params.push(filters.active);
  }

  const [rows] = await pool.query(sql, params);
  return rows[0].total;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT
      ${customerColumns}
    FROM customers
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO customers
    (name, email, is_foreign, cpf, rnm, birth_date, zip_code, street, number, complement, district, city, state, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.email,
      data.is_foreign,
      data.cpf,
      data.rnm,
      data.birth_date,
      data.zip_code,
      data.street,
      data.number,
      data.complement,
      data.district,
      data.city,
      data.state,
      data.active
    ]
  );

  return result.insertId;
}

async function update(id, data) {
  await pool.query(
    `UPDATE customers
    SET name = ?, email = ?, is_foreign = ?, cpf = ?, rnm = ?, birth_date = ?, zip_code = ?, street = ?, number = ?, complement = ?, district = ?, city = ?, state = ?, active = ?
    WHERE id = ?`,
    [
      data.name,
      data.email,
      data.is_foreign,
      data.cpf,
      data.rnm,
      data.birth_date,
      data.zip_code,
      data.street,
      data.number,
      data.complement,
      data.district,
      data.city,
      data.state,
      data.active,
      id
    ]
  );
}

async function updateActiveStatus(id, active) {
  const [result] = await pool.query(
    "UPDATE customers SET active = ? WHERE id = ?",
    [active, id]
  );

  return result.affectedRows;
}

module.exports = {
  count,
  create,
  findAll,
  findById,
  update,
  updateActiveStatus
};
