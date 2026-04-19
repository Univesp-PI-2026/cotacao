const { hashPassword } = require("../../utils/passwordHasher");
const userRepository = require("./users.repository");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function listUsers(query = {}) {
  const active =
    query.active === "0" || query.active === "1" ? Number(query.active) : undefined;
  const roleId = query.role_id ? Number(query.role_id) : undefined;

  return userRepository.findAll({
    active,
    role_id: Number.isNaN(roleId) ? undefined : roleId
  });
}

async function countUsers(query = {}) {
  const active =
    query.active === "0" || query.active === "1" ? Number(query.active) : undefined;
  const roleId = query.role_id ? Number(query.role_id) : undefined;

  return userRepository.count({
    active,
    role_id: Number.isNaN(roleId) ? undefined : roleId
  });
}

async function getUserById(id) {
  const user = await userRepository.findById(id);

  if (!user) {
    throw createError("users.not_found", 404);
  }

  return user;
}

async function ensureRole(roleId) {
  const exists = await userRepository.roleExists(roleId);

  if (!exists) {
    throw createError("users.invalid_role", 400);
  }
}

function isAdminUser(user) {
  return user && user.role_name === "admin";
}

async function ensureAtLeastOneActiveAdminAfterChange(user, nextData) {
  const nextRole = await userRepository.findRoleById(nextData.role_id);
  const willRemainAdmin = nextRole && nextRole.name === "admin";
  const willRemainActive = nextData.active === 1;

  if (!isAdminUser(user)) {
    return;
  }

  if (willRemainAdmin && willRemainActive) {
    return;
  }

  const otherActiveAdmins = await userRepository.countActiveAdmins(user.id);

  if (otherActiveAdmins === 0) {
    throw createError("users.last_active_admin_required", 400);
  }
}

async function createUser(data) {
  await ensureRole(data.role_id);

  const passwordHash = await hashPassword(data.password);
  const userId = await userRepository.create({
    ...data,
    password: passwordHash
  });

  return userRepository.findById(userId);
}

async function updateUser(id, data) {
  const existingUser = await userRepository.findById(id);

  if (!existingUser) {
    throw createError("users.not_found", 404);
  }

  await ensureRole(data.role_id);
  await ensureAtLeastOneActiveAdminAfterChange(existingUser, data);

  const payload = { ...data };

  if (payload.password) {
    payload.password = await hashPassword(payload.password);
  }

  await userRepository.update(id, payload);
  return userRepository.findById(id);
}

async function activateUser(id) {
  const affectedRows = await userRepository.updateActiveStatus(id, 1);

  if (affectedRows === 0) {
    throw createError("users.not_found", 404);
  }
}

async function deactivateUser(id) {
  const existingUser = await userRepository.findById(id);

  if (!existingUser) {
    throw createError("users.not_found", 404);
  }

  await ensureAtLeastOneActiveAdminAfterChange(existingUser, {
    role_id: existingUser.role_id,
    active: 0
  });

  const affectedRows = await userRepository.updateActiveStatus(id, 0);

  if (affectedRows === 0) {
    throw createError("users.not_found", 404);
  }
}

module.exports = {
  activateUser,
  countUsers,
  createUser,
  deactivateUser,
  getUserById,
  listUsers,
  updateUser
};
