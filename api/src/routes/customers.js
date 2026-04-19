const express = require("express");

const pool = require("../db");
const { validateCustomerPayload } = require("../validators/customerValidator");
const { badRequest, notFound, serverError } = require("../utils/http");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const active = req.query.active;
    let sql = `
      SELECT
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
      FROM customers
    `;
    const params = [];

    if (active === "0" || active === "1") {
      sql += " WHERE active = ?";
      params.push(Number(active));
    }

    sql += " ORDER BY id DESC";

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (error) {
    return serverError(res, error, "Falha ao listar clientes");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM customers WHERE id = ? LIMIT 1",
      [req.params.id]
    );

    if (rows.length === 0) {
      return notFound(res, "Cliente nao encontrado");
    }

    return res.json(rows[0]);
  } catch (error) {
    return serverError(res, error, "Falha ao buscar cliente");
  }
});

router.post("/", async (req, res) => {
  const validation = validateCustomerPayload(req.body);

  if (validation.errors) {
    return badRequest(res, validation.errors);
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO customers
      (name, email, is_foreign, cpf, rnm, birth_date, zip_code, street, number, complement, district, city, state, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        validation.data.name,
        validation.data.email,
        validation.data.is_foreign,
        validation.data.cpf,
        validation.data.rnm,
        validation.data.birth_date,
        validation.data.zip_code,
        validation.data.street,
        validation.data.number,
        validation.data.complement,
        validation.data.district,
        validation.data.city,
        validation.data.state,
        validation.data.active
      ]
    );

    const [rows] = await pool.query(
      "SELECT * FROM customers WHERE id = ? LIMIT 1",
      [result.insertId]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return badRequest(res, ["email, cpf or rnm already exists"]);
    }

    return serverError(res, error, "Falha ao criar cliente");
  }
});

router.put("/:id", async (req, res) => {
  const validation = validateCustomerPayload(req.body);

  if (validation.errors) {
    return badRequest(res, validation.errors);
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM customers WHERE id = ? LIMIT 1",
      [req.params.id]
    );

    if (existing.length === 0) {
      return notFound(res, "Cliente nao encontrado");
    }

    await pool.query(
      `UPDATE customers
      SET name = ?, email = ?, is_foreign = ?, cpf = ?, rnm = ?, birth_date = ?, zip_code = ?, street = ?, number = ?, complement = ?, district = ?, city = ?, state = ?, active = ?
      WHERE id = ?`,
      [
        validation.data.name,
        validation.data.email,
        validation.data.is_foreign,
        validation.data.cpf,
        validation.data.rnm,
        validation.data.birth_date,
        validation.data.zip_code,
        validation.data.street,
        validation.data.number,
        validation.data.complement,
        validation.data.district,
        validation.data.city,
        validation.data.state,
        validation.data.active,
        req.params.id
      ]
    );

    const [rows] = await pool.query(
      "SELECT * FROM customers WHERE id = ? LIMIT 1",
      [req.params.id]
    );

    return res.json(rows[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return badRequest(res, ["email, cpf or rnm already exists"]);
    }

    return serverError(res, error, "Falha ao atualizar cliente");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE customers SET active = 0 WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return notFound(res, "Cliente nao encontrado");
    }

    return res.json({ message: "Cliente desativado com sucesso" });
  } catch (error) {
    return serverError(res, error, "Falha ao desativar cliente");
  }
});

router.patch("/:id/activate", async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE customers SET active = 1 WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return notFound(res, "Cliente nao encontrado");
    }

    return res.json({ message: "Cliente ativado com sucesso" });
  } catch (error) {
    return serverError(res, error, "Falha ao ativar cliente");
  }
});

router.patch("/:id/deactivate", async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE customers SET active = 0 WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return notFound(res, "Cliente nao encontrado");
    }

    return res.json({ message: "Cliente desativado com sucesso" });
  } catch (error) {
    return serverError(res, error, "Falha ao desativar cliente");
  }
});

module.exports = router;
