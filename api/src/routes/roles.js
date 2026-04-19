const express = require("express");

const pool = require("../db");
const { validateRolePayload } = require("../validators/roleValidator");
const { badRequest, notFound, serverError } = require("../utils/http");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        r.id,
        r.name,
        r.created_at,
        r.updated_at,
        COUNT(u.id) AS users_count
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.id
      GROUP BY r.id, r.name, r.created_at, r.updated_at
      ORDER BY r.name ASC`
    );

    return res.json(rows);
  } catch (error) {
    return serverError(res, error, "Falha ao listar roles");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        r.id,
        r.name,
        r.created_at,
        r.updated_at,
        COUNT(u.id) AS users_count
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.id
      WHERE r.id = ?
      GROUP BY r.id, r.name, r.created_at, r.updated_at
      LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return notFound(res, "Role nao encontrada");
    }

    return res.json(rows[0]);
  } catch (error) {
    return serverError(res, error, "Falha ao buscar role");
  }
});

router.post("/", async (req, res) => {
  const validation = validateRolePayload(req.body);

  if (validation.errors) {
    return badRequest(res, validation.errors);
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO roles (name) VALUES (?)",
      [validation.data.name]
    );

    const [rows] = await pool.query(
      `SELECT
        r.id,
        r.name,
        r.created_at,
        r.updated_at,
        COUNT(u.id) AS users_count
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.id
      WHERE r.id = ?
      GROUP BY r.id, r.name, r.created_at, r.updated_at
      LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return badRequest(res, ["name already exists"]);
    }

    return serverError(res, error, "Falha ao criar role");
  }
});

router.put("/:id", async (req, res) => {
  const validation = validateRolePayload(req.body);

  if (validation.errors) {
    return badRequest(res, validation.errors);
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM roles WHERE id = ? LIMIT 1",
      [req.params.id]
    );

    if (existing.length === 0) {
      return notFound(res, "Role nao encontrada");
    }

    await pool.query(
      "UPDATE roles SET name = ? WHERE id = ?",
      [validation.data.name, req.params.id]
    );

    const [rows] = await pool.query(
      `SELECT
        r.id,
        r.name,
        r.created_at,
        r.updated_at,
        COUNT(u.id) AS users_count
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.id
      WHERE r.id = ?
      GROUP BY r.id, r.name, r.created_at, r.updated_at
      LIMIT 1`,
      [req.params.id]
    );

    return res.json(rows[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return badRequest(res, ["name already exists"]);
    }

    return serverError(res, error, "Falha ao atualizar role");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [existing] = await pool.query(
      "SELECT id FROM roles WHERE id = ? LIMIT 1",
      [req.params.id]
    );

    if (existing.length === 0) {
      return notFound(res, "Role nao encontrada");
    }

    const [usageRows] = await pool.query(
      "SELECT COUNT(*) AS total FROM users WHERE role_id = ?",
      [req.params.id]
    );

    if (usageRows[0].total > 0) {
      return badRequest(res, ["role is being used by users"]);
    }

    await pool.query("DELETE FROM roles WHERE id = ?", [req.params.id]);

    return res.json({ message: "Role removida com sucesso" });
  } catch (error) {
    return serverError(res, error, "Falha ao remover role");
  }
});

module.exports = router;
