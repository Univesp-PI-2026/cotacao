const express = require("express");
const jwt = require("jsonwebtoken");

const pool = require("../db");
const { badRequest } = require("../utils/http");
const { hashPassword, needsRehash, verifyPassword } = require("../utils/passwordHasher");

const router = express.Router();

router.post("/login", async (req, res) => {
  const identifier = String(req.body.identifier || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!identifier || !password) {
    return badRequest(res, ["identifier and password are required"]);
  }

  try {
    const [rows] = await pool.query(
      `SELECT
        u.id,
        u.role_id,
        r.name AS role_name,
        u.name,
        u.email,
        u.password,
        u.active,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.email = ?
      LIMIT 1`,
      [identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Credenciais invalidas" });
    }

    const user = rows[0];
    const validPassword = await verifyPassword(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Credenciais invalidas" });
    }

    if (user.active !== 1) {
      return res.status(403).json({ message: "Usuario inativo" });
    }

    if (needsRehash(user.password)) {
      const newHash = await hashPassword(password);
      await pool.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [newHash, user.id]
      );
    }

    const authUser = {
      id: user.id,
      role_id: user.role_id,
      role_name: user.role_name,
      name: user.name,
      email: user.email,
      active: user.active,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    const token = jwt.sign(
      {
        sub: String(user.id),
        role_id: user.role_id,
        role_name: user.role_name,
        email: user.email
      },
      process.env.JWT_SECRET || "cotacao_v02_dev_secret_change_me",
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "8h"
      }
    );

    return res.json({
      token,
      user: authUser
    });
  } catch (error) {
    return res.status(500).json({
      message: "Falha ao autenticar",
      detail: error.message
    });
  }
});

module.exports = router;
