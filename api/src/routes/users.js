const express = require("express");

const pool = require("../db");
const { validateUserPayload } = require("../validators/userValidator");
const { badRequest, notFound, serverError } = require("../utils/http");
const { hashPassword } = require("../utils/passwordHasher");

const router = express.Router();

const baseSelect = `
  SELECT
    u.id,
    u.role_id,
    r.name AS role_name,
    u.name,
    u.email,
    u.email_verified_at,
    u.active,
    u.created_at,
    u.updated_at
  FROM users u
  LEFT JOIN roles r ON r.id = u.role_id
`;

router.get("/", async (req, res) => {
  try {
    const active = req.query.active;
    const roleId = req.query.role_id;
    let sql = baseSelect;
    const clauses = [];
    const params = [];

    if (active === "0" || active === "1") {
      clauses.push("u.active = ?");
      params.push(Number(active));
    }

    if (roleId) {
      clauses.push("u.role_id = ?");
      params.push(Number(roleId));
    }

    if (clauses.length > 0) {
      sql += ` WHERE ${clauses.join(" AND ")}`;
    }

    sql += " ORDER BY u.name ASC";

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (error) {
    return serverError(res, error, "Falha ao listar usuarios");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${baseSelect} WHERE u.id = ? LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return notFound(res, "Usuario nao encontrado");
    }

    return res.json(rows[0]);
  } catch (error) {
    return serverError(res, error, "Falha ao buscar usuario");
  }
});

router.post("/", async (req, res) => {
  const validation = validateUserPayload(req.body, { requiresPassword: true });

  if (validation.errors) {
    return badRequest(res, validation.errors);
  }

  try {
    const [roles] = await pool.query(
      "SELECT id FROM roles WHERE id = ? LIMIT 1",
      [validation.data.role_id]
    );

    if (roles.length === 0) {
      return badRequest(res, ["role_id is invalid"]);
    }

    const passwordHash = await hashPassword(validation.data.password);

    const [result] = await pool.query(
      `INSERT INTO users
      (role_id, name, email, password, active)
      VALUES (?, ?, ?, ?, ?)`,
      [
        validation.data.role_id,
        validation.data.name,
        validation.data.email,
        passwordHash,
        validation.data.active
      ]
    );

    const [rows] = await pool.query(
      `${baseSelect} WHERE u.id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return badRequest(res, ["email already exists"]);
    }

    return serverError(res, error, "Falha ao criar usuario");
  }
});

router.put("/:id", async (req, res) => {
  const validation = validateUserPayload(req.body, { requiresPassword: false });

  if (validation.errors) {
    return badRequest(res, validation.errors);
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE id = ? LIMIT 1",
      [req.params.id]
    );

    if (existing.length === 0) {
      return notFound(res, "Usuario nao encontrado");
    }

    const [roles] = await pool.query(
      "SELECT id FROM roles WHERE id = ? LIMIT 1",
      [validation.data.role_id]
    );

    if (roles.length === 0) {
      return badRequest(res, ["role_id is invalid"]);
    }

    if (validation.data.password) {
      const passwordHash = await hashPassword(validation.data.password);
      await pool.query(
        `UPDATE users
        SET role_id = ?, name = ?, email = ?, password = ?, active = ?
        WHERE id = ?`,
        [
          validation.data.role_id,
          validation.data.name,
          validation.data.email,
          passwordHash,
          validation.data.active,
          req.params.id
        ]
      );
    } else {
      await pool.query(
        `UPDATE users
        SET role_id = ?, name = ?, email = ?, active = ?
        WHERE id = ?`,
        [
          validation.data.role_id,
          validation.data.name,
          validation.data.email,
          validation.data.active,
          req.params.id
        ]
      );
    }

    const [rows] = await pool.query(
      `${baseSelect} WHERE u.id = ? LIMIT 1`,
      [req.params.id]
    );

    return res.json(rows[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return badRequest(res, ["email already exists"]);
    }

    return serverError(res, error, "Falha ao atualizar usuario");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE users SET active = 0 WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return notFound(res, "Usuario nao encontrado");
    }

    return res.json({ message: "Usuario desativado com sucesso" });
  } catch (error) {
    return serverError(res, error, "Falha ao desativar usuario");
  }
});

router.patch("/:id/activate", async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE users SET active = 1 WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return notFound(res, "Usuario nao encontrado");
    }

    return res.json({ message: "Usuario ativado com sucesso" });
  } catch (error) {
    return serverError(res, error, "Falha ao ativar usuario");
  }
});

module.exports = router;
