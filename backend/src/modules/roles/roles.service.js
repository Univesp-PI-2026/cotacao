const roleRepository = require("./roles.repository");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createRolesService(repository = roleRepository) {
  async function listRoles() {
    return repository.findAll();
  }

  async function listRolesByQuery(query = {}) {
    const active =
      query.active === "0" || query.active === "1" ? Number(query.active) : undefined;

    return repository.findAll({ active });
  }

  async function getRoleById(id) {
    const role = await repository.findById(id);

    if (!role) {
      throw createError("roles.not_found", 404);
    }

    return role;
  }

  async function createRole(data) {
    const roleId = await repository.create(data);
    return repository.findById(roleId);
  }

  async function updateRole(id, data) {
    const existingRole = await repository.findById(id);

    if (!existingRole) {
      throw createError("roles.not_found", 404);
    }

    if (existingRole.active === 1 && data.active === 0) {
      const usersCount = await repository.countUsersByRoleId(id);

      if (usersCount > 0) {
        throw createError("roles.in_use", 400);
      }
    }

    await repository.update(id, data);
    return repository.findById(id);
  }

  async function deactivateRole(id) {
    const existingRole = await repository.findById(id);

    if (!existingRole) {
      throw createError("roles.not_found", 404);
    }

    const usersCount = await repository.countUsersByRoleId(id);

    if (usersCount > 0) {
      throw createError("roles.in_use", 400);
    }

    const affectedRows = await repository.updateActiveStatus(id, 0);

    if (affectedRows === 0) {
      throw createError("roles.not_found", 404);
    }
  }

  async function activateRole(id) {
    const affectedRows = await repository.updateActiveStatus(id, 1);

    if (affectedRows === 0) {
      throw createError("roles.not_found", 404);
    }
  }

  return {
    activateRole,
    createRole,
    deactivateRole,
    getRoleById,
    listRoles,
    listRolesByQuery,
    updateRole
  };
}

module.exports = {
  ...createRolesService(),
  createRolesService
};
