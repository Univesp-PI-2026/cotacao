const jwt = require("jsonwebtoken");

const authRepository = require("./auth.repository");
const { verifyPassword } = require("../../utils/passwordHasher");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function login(identifier, password) {
  const normalizedIdentifier = String(identifier || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");

  const user = await authRepository.findUserForLogin(normalizedIdentifier);

  if (!user) {
    throw createError("auth.invalid_credentials", 401);
  }

  const validPassword = await verifyPassword(normalizedPassword, user.password);

  if (!validPassword) {
    throw createError("auth.invalid_credentials", 401);
  }

  if (user.active !== 1) {
    throw createError("auth.invalid_credentials", 401);
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

  return {
    token,
    user: authUser
  };
}

module.exports = {
  login
};
