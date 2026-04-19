const express = require("express");
const jwt = require("jsonwebtoken");

const pool = require("../db");
const { badRequest } = require("../utils/http");
const { hashPassword, needsRehash, verifyPassword } = require("../utils/passwordHasher");
const { getRequestLocale, t } = require("../utils/i18n");

const router = express.Router();

async function hasUsernameColumn() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'username'`
  );

  return rows[0].total > 0;
}

router.post("/login", async (req, res) => {
  const locale = getRequestLocale(req);
  const identifier = String(req.body.identifier || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!identifier || !password) {
    return badRequest(res, [t("auth.login_required_fields", locale)], locale);
  }

  try {
    const supportsUsername = await hasUsernameColumn();
    const usernameSelect = supportsUsername ? "u.username," : "NULL AS username,";
    const whereClause = supportsUsername ? "WHERE u.email = ? OR u.username = ?" : "WHERE u.email = ?";
    const params = supportsUsername ? [identifier, identifier] : [identifier];

    const [rows] = await pool.query(
      `SELECT
        u.id,
        u.role_id,
        r.name AS role_name,
        u.name,
        ${usernameSelect}
        u.email,
        u.password,
        u.active,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      ${whereClause}
      LIMIT 1`,
      params
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: t("auth.invalid_credentials", locale) });
    }

    const user = rows[0];
    const validPassword = await verifyPassword(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: t("auth.invalid_credentials", locale) });
    }

    if (user.active !== 1) {
      return res.status(403).json({ message: t("auth.inactive_user", locale) });
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
      username: user.username || user.email,
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
        username: user.username || user.email,
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
      message: t("auth.login_failed", locale),
      detail: error.message
    });
  }
});

module.exports = router;
