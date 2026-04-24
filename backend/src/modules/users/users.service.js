const userRepository = require("./users.repository");
const passwordHasher = require("../../utils/passwordHasher");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createUsersService({
  repository = userRepository,
  hasher = passwordHasher
} = {}) {
  async function listUsers(query = {}) {
    const active =
      query.active === "0" || query.active === "1" ? Number(query.active) : undefined;
    const roleId = query.role_id ? Number(query.role_id) : undefined;

    return repository.findAll({
      active,
      role_id: Number.isNaN(roleId) ? undefined : roleId
    });
  }

  async function countUsers(query = {}) {
    const active =
      query.active === "0" || query.active === "1" ? Number(query.active) : undefined;
    const roleId = query.role_id ? Number(query.role_id) : undefined;

    return repository.count({
      active,
      role_id: Number.isNaN(roleId) ? undefined : roleId
    });
  }

  async function getUserById(id) {
    const user = await repository.findById(id);

    if (!user) {
      throw createError("users.not_found", 404);
    }

    return user;
  }

  async function ensureRole(roleId) {
    const exists = await repository.roleExists(roleId);

    if (!exists) {
      throw createError("users.invalid_role", 400);
    }
  }

  function isAdminUser(user) {
    return user && user.role_name === "admin";
  }

  async function ensureAtLeastOneActiveAdminAfterChange(user, nextData) {
    const nextRole = await repository.findRoleById(nextData.role_id);
    const willRemainAdmin = nextRole && nextRole.name === "admin";
    const willRemainActive = nextData.active === 1;

    if (!isAdminUser(user)) {
      return;
    }

    if (willRemainAdmin && willRemainActive) {
      return;
    }

    const otherActiveAdmins = await repository.countActiveAdmins(user.id);

    if (otherActiveAdmins === 0) {
      throw createError("users.last_active_admin_required", 400);
    }
  }

  async function createUser(data) {
    await ensureRole(data.role_id);

    const passwordHash = await hasher.hashPassword(data.password);
    const userId = await repository.create({
      ...data,
      password: passwordHash
    });

    return repository.findById(userId);
  }

  async function updateUser(id, data) {
    const existingUser = await repository.findById(id);

    if (!existingUser) {
      throw createError("users.not_found", 404);
    }

    await ensureRole(data.role_id);
    await ensureAtLeastOneActiveAdminAfterChange(existingUser, data);

    const payload = { ...data };

    if (payload.password) {
      payload.password = await hasher.hashPassword(payload.password);
    }

    await repository.update(id, payload);
    return repository.findById(id);
  }

  async function updateUserPassword(id, password, previousPassword, actorRoleName) {
    const existingUser = await repository.findByIdWithPassword(id);

    if (!existingUser) {
      throw createError("users.not_found", 404);
    }

    const isAdminActor = String(actorRoleName || "").trim().toLowerCase().includes("admin");

    if (!isAdminActor) {
      if (!previousPassword || String(previousPassword).trim().length === 0) {
        throw createError("users.previous_password_required", 400);
      }

      const validPreviousPassword = await hasher.verifyPassword(
        String(previousPassword),
        existingUser.password
      );

      if (!validPreviousPassword) {
        throw createError("users.previous_password_invalid", 400);
      }
    }

    const passwordHash = await hasher.hashPassword(password);
    const affectedRows = await repository.updatePassword(id, passwordHash);

    if (affectedRows === 0) {
      throw createError("users.not_found", 404);
    }
  }

  async function activateUser(id) {
    const affectedRows = await repository.updateActiveStatus(id, 1);

    if (affectedRows === 0) {
      throw createError("users.not_found", 404);
    }
  }

  async function deactivateUser(id) {
    const existingUser = await repository.findById(id);

    if (!existingUser) {
      throw createError("users.not_found", 404);
    }

    await ensureAtLeastOneActiveAdminAfterChange(existingUser, {
      role_id: existingUser.role_id,
      active: 0
    });

    const affectedRows = await repository.updateActiveStatus(id, 0);

    if (affectedRows === 0) {
      throw createError("users.not_found", 404);
    }
  }

  return {
    activateUser,
    countUsers,
    createUser,
    deactivateUser,
    getUserById,
    listUsers,
    updateUserPassword,
    updateUser
  };
}

module.exports = {
  ...createUsersService(),
  createUsersService
};
