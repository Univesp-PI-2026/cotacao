const pool = require("../../db");

const quotationListSelect = `
  SELECT
    q.id,
    q.customer_id,
    c.name AS customer_name,
    c.email AS customer_email,
    q.request_date,
    q.insurance_type,
    q.bonus_class,
    q.has_claims,
    q.vehicle_plate,
    q.vehicle_chassis,
    q.vehicle_brand,
    q.vehicle_model,
    q.manufacture_year,
    q.overnight_zipcode,
    q.driver_age,
    q.license_time,
    q.coverages,
    q.has_insurer_preference,
    q.preferred_insurer,
    q.active,
    q.created_at,
    q.updated_at
  FROM quotations q
  INNER JOIN customers c ON c.id = q.customer_id
`;

async function findAll(filters = {}) {
  let sql = quotationListSelect;
  const where = [];
  const params = [];

  if (filters.active === 0 || filters.active === 1) {
    where.push("q.active = ?");
    params.push(filters.active);
  }

  if (filters.customer_id) {
    where.push("q.customer_id = ?");
    params.push(filters.customer_id);
  }

  if (where.length > 0) {
    sql += ` WHERE ${where.join(" AND ")}`;
  }

  sql += " ORDER BY q.id DESC";

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function count(filters = {}) {
  let sql = "SELECT COUNT(*) AS total FROM quotations q";
  const where = [];
  const params = [];

  if (filters.active === 0 || filters.active === 1) {
    where.push("q.active = ?");
    params.push(filters.active);
  }

  if (filters.customer_id) {
    where.push("q.customer_id = ?");
    params.push(filters.customer_id);
  }

  if (where.length > 0) {
    sql += ` WHERE ${where.join(" AND ")}`;
  }

  const [rows] = await pool.query(sql, params);
  return rows[0].total;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT
      q.*,
      c.name AS customer_name,
      c.email AS customer_email
    FROM quotations q
    INNER JOIN customers c ON c.id = q.customer_id
    WHERE q.id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function customerExists(customerId) {
  const [rows] = await pool.query(
    "SELECT id FROM customers WHERE id = ? LIMIT 1",
    [customerId]
  );

  return rows.length > 0;
}

async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO quotations
    (customer_id, request_date, insurance_type, bonus_class, has_claims, vehicle_plate, vehicle_chassis, vehicle_brand, vehicle_model, manufacture_year, overnight_zipcode, driver_age, license_time, coverages, has_insurer_preference, preferred_insurer, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.customer_id,
      data.request_date,
      data.insurance_type,
      data.bonus_class,
      data.has_claims,
      data.vehicle_plate,
      data.vehicle_chassis,
      data.vehicle_brand,
      data.vehicle_model,
      data.manufacture_year,
      data.overnight_zipcode,
      data.driver_age,
      data.license_time,
      JSON.stringify(data.coverages),
      data.has_insurer_preference,
      data.preferred_insurer,
      data.active
    ]
  );

  return result.insertId;
}

async function update(id, data) {
  await pool.query(
    `UPDATE quotations
    SET customer_id = ?, request_date = ?, insurance_type = ?, bonus_class = ?, has_claims = ?, vehicle_plate = ?, vehicle_chassis = ?, vehicle_brand = ?, vehicle_model = ?, manufacture_year = ?, overnight_zipcode = ?, driver_age = ?, license_time = ?, coverages = ?, has_insurer_preference = ?, preferred_insurer = ?, active = ?
    WHERE id = ?`,
    [
      data.customer_id,
      data.request_date,
      data.insurance_type,
      data.bonus_class,
      data.has_claims,
      data.vehicle_plate,
      data.vehicle_chassis,
      data.vehicle_brand,
      data.vehicle_model,
      data.manufacture_year,
      data.overnight_zipcode,
      data.driver_age,
      data.license_time,
      JSON.stringify(data.coverages),
      data.has_insurer_preference,
      data.preferred_insurer,
      data.active,
      id
    ]
  );
}

async function updateActiveStatus(id, active) {
  const [result] = await pool.query(
    "UPDATE quotations SET active = ? WHERE id = ?",
    [active, id]
  );

  return result.affectedRows;
}

module.exports = {
  count,
  create,
  customerExists,
  findAll,
  findById,
  update,
  updateActiveStatus
};
