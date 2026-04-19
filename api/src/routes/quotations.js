const express = require("express");

const pool = require("../db");
const { badRequest, notFound, serverError } = require("../utils/http");
const { validateQuotationPayload } = require("../validators/quotationValidator");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const active = req.query.active;
    const customerId = req.query.customer_id;
    let sql = `
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
    const params = [];
    const where = [];

    if (active === "0" || active === "1") {
      where.push("q.active = ?");
      params.push(Number(active));
    }

    if (customerId) {
      where.push("q.customer_id = ?");
      params.push(Number(customerId));
    }

    if (where.length > 0) {
      sql += ` WHERE ${where.join(" AND ")}`;
    }

    sql += " ORDER BY q.id DESC";

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (error) {
    return serverError(res, error, "Falha ao listar cotacoes");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        q.*,
        c.name AS customer_name,
        c.email AS customer_email
      FROM quotations q
      INNER JOIN customers c ON c.id = q.customer_id
      WHERE q.id = ?
      LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return notFound(res, "Cotacao nao encontrada");
    }

    return res.json(rows[0]);
  } catch (error) {
    return serverError(res, error, "Falha ao buscar cotacao");
  }
});

router.post("/", async (req, res) => {
  const validation = validateQuotationPayload(req.body);

  if (validation.errors) {
    return badRequest(res, validation.errors);
  }

  try {
    const [customerRows] = await pool.query(
      "SELECT id FROM customers WHERE id = ? LIMIT 1",
      [validation.data.customer_id]
    );

    if (customerRows.length === 0) {
      return badRequest(res, ["customer_id does not exist"]);
    }

    const [result] = await pool.query(
      `INSERT INTO quotations
      (customer_id, request_date, insurance_type, bonus_class, has_claims, vehicle_plate, vehicle_chassis, vehicle_brand, vehicle_model, manufacture_year, overnight_zipcode, driver_age, license_time, coverages, has_insurer_preference, preferred_insurer, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        validation.data.customer_id,
        validation.data.request_date,
        validation.data.insurance_type,
        validation.data.bonus_class,
        validation.data.has_claims,
        validation.data.vehicle_plate,
        validation.data.vehicle_chassis,
        validation.data.vehicle_brand,
        validation.data.vehicle_model,
        validation.data.manufacture_year,
        validation.data.overnight_zipcode,
        validation.data.driver_age,
        validation.data.license_time,
        JSON.stringify(validation.data.coverages),
        validation.data.has_insurer_preference,
        validation.data.preferred_insurer,
        validation.data.active
      ]
    );

    const [rows] = await pool.query("SELECT * FROM quotations WHERE id = ? LIMIT 1", [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    return serverError(res, error, "Falha ao criar cotacao");
  }
});

router.put("/:id", async (req, res) => {
  const validation = validateQuotationPayload(req.body);

  if (validation.errors) {
    return badRequest(res, validation.errors);
  }

  try {
    const [existing] = await pool.query("SELECT id FROM quotations WHERE id = ? LIMIT 1", [req.params.id]);

    if (existing.length === 0) {
      return notFound(res, "Cotacao nao encontrada");
    }

    await pool.query(
      `UPDATE quotations
      SET customer_id = ?, request_date = ?, insurance_type = ?, bonus_class = ?, has_claims = ?, vehicle_plate = ?, vehicle_chassis = ?, vehicle_brand = ?, vehicle_model = ?, manufacture_year = ?, overnight_zipcode = ?, driver_age = ?, license_time = ?, coverages = ?, has_insurer_preference = ?, preferred_insurer = ?, active = ?
      WHERE id = ?`,
      [
        validation.data.customer_id,
        validation.data.request_date,
        validation.data.insurance_type,
        validation.data.bonus_class,
        validation.data.has_claims,
        validation.data.vehicle_plate,
        validation.data.vehicle_chassis,
        validation.data.vehicle_brand,
        validation.data.vehicle_model,
        validation.data.manufacture_year,
        validation.data.overnight_zipcode,
        validation.data.driver_age,
        validation.data.license_time,
        JSON.stringify(validation.data.coverages),
        validation.data.has_insurer_preference,
        validation.data.preferred_insurer,
        validation.data.active,
        req.params.id
      ]
    );

    const [rows] = await pool.query("SELECT * FROM quotations WHERE id = ? LIMIT 1", [req.params.id]);
    return res.json(rows[0]);
  } catch (error) {
    return serverError(res, error, "Falha ao atualizar cotacao");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE quotations SET active = 0 WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return notFound(res, "Cotacao nao encontrada");
    }

    return res.json({ message: "Cotacao desativada com sucesso" });
  } catch (error) {
    return serverError(res, error, "Falha ao desativar cotacao");
  }
});

router.patch("/:id/activate", async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE quotations SET active = 1 WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return notFound(res, "Cotacao nao encontrada");
    }

    return res.json({ message: "Cotacao ativada com sucesso" });
  } catch (error) {
    return serverError(res, error, "Falha ao ativar cotacao");
  }
});

module.exports = router;
