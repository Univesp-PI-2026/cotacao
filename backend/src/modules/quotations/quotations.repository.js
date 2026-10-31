const pool = require("../../db");
const { products } = require("./quotation-products");

const detailFields = [...new Set(Object.values(products).flatMap((product) => product.fields))];
const detailSelect = detailFields.map((field) => {
  const sources = Object.values(products)
    .filter((product) => product.fields.includes(field))
    .map((product) => `${product.alias}.${field}`);
  return `${sources.length > 1 ? `COALESCE(${sources.join(", ")})` : sources[0]} AS ${field}`;
}).join(",\n    ");
const quotationListSelect = `
  SELECT q.*, c.name AS customer_name, c.cpf AS customer_cpf, c.email AS customer_email,
    ${detailSelect}
  FROM quotations q
  INNER JOIN customers c ON c.id = q.customer_id
  ${Object.values(products).map((product) =>
    `LEFT JOIN ${product.table} ${product.alias} ON ${product.alias}.quotation_id = q.id`
  ).join("\n  ")}
`;

function buildWhere(filters = {}) {
  const conditions = [];
  const params = [];
  for (const field of ["active", "customer_id", "product"]) {
    if (filters[field] !== undefined) {
      conditions.push(`q.${field} = ?`);
      params.push(filters[field]);
    }
  }
  return { sql: conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "", params };
}

async function findAll(filters = {}) {
  const where = buildWhere(filters);
  const [rows] = await pool.query(`${quotationListSelect}${where.sql} ORDER BY q.id DESC`, where.params);
  return rows;
}

async function count(filters = {}) {
  const where = buildWhere(filters);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM quotations q${where.sql}`, where.params);
  return rows[0].total;
}

async function findById(id, product) {
  const [rows] = await pool.query(
    `${quotationListSelect} WHERE q.id = ?${product ? " AND q.product = ?" : ""} LIMIT 1`,
    product ? [id, product] : [id]
  );
  return rows[0] || null;
}

async function customerExists(customerId) {
  const [rows] = await pool.query("SELECT id FROM customers WHERE id = ? LIMIT 1", [customerId]);
  return rows.length > 0;
}

async function inTransaction(action) {
  const connection = await pool.getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await action(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function insertDetails(connection, quotationId, data) {
  const definition = Object.hasOwn(products, data.product) ? products[data.product] : undefined;
  if (!definition) throw new Error("Invalid quotation product");
  const fields = definition.fields;
  await connection.query(
    `INSERT INTO ${definition.table} (quotation_id, ${fields.join(", ")}) VALUES (?, ${fields.map(() => "?").join(", ")})`,
    [quotationId, ...fields.map((field) => field === "coverages" ? JSON.stringify(data[field]) : data[field])]
  );
}

async function create(data) {
  return inTransaction(async (connection) => {
    const [result] = await connection.query(
      "INSERT INTO quotations (customer_id, product, request_date, active) VALUES (?, ?, ?, ?)",
      [data.customer_id, data.product, data.request_date, data.active]
    );
    await insertDetails(connection, result.insertId, data);
    return result.insertId;
  });
}

async function update(id, data, product) {
  return inTransaction(async (connection) => {
    const [rows] = await connection.query(
      `SELECT id FROM quotations WHERE id = ?${product ? " AND product = ?" : ""} FOR UPDATE`,
      product ? [id, product] : [id]
    );
    if (!rows.length) return false;
    await connection.query(
      "UPDATE quotations SET customer_id = ?, product = ?, request_date = ?, active = ? WHERE id = ?",
      [data.customer_id, data.product, data.request_date, data.active, id]
    );
    for (const definition of Object.values(products)) {
      await connection.query(`DELETE FROM ${definition.table} WHERE quotation_id = ?`, [id]);
    }
    await insertDetails(connection, id, data);
    return true;
  });
}

async function updateActiveStatus(id, active, product) {
  const [result] = await pool.query(
    `UPDATE quotations SET active = ? WHERE id = ?${product ? " AND product = ?" : ""}`,
    product ? [active, id, product] : [active, id]
  );
  return result.affectedRows;
}

module.exports = { count, create, customerExists, findAll, findById, update, updateActiveStatus };
