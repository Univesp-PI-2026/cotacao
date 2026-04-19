const roleRepository = require("./roles.repository");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function listRoles() {
  return roleRepository.findAll();
}

async function listRolesByQuery(query = {}) {
  const active =
    query.active === "0" || query.active === "1" ? Number(query.active) : undefined;

  return roleRepository.findAll({ active });
}

async function getRoleById(id) {
  const role = await roleRepository.findById(id);

  if (!role) {
    throw createError("roles.not_found", 404);
  }

  return role;
}

async function createRole(data) {
  const roleId = await roleRepository.create(data);
  return roleRepository.findById(roleId);
}

async function updateRole(id, data) {
  const existingRole = await roleRepository.findById(id);

  if (!existingRole) {
    throw createError("roles.not_found", 404);
  }

  if (existingRole.active === 1 && data.active === 0) {
    const usersCount = await roleRepository.countUsersByRoleId(id);

    if (usersCount > 0) {
      throw createError("roles.in_use", 400);
    }
  }

  await roleRepository.update(id, data);
  return roleRepository.findById(id);
}

async function deactivateRole(id) {
  const existingRole = await roleRepository.findById(id);

  if (!existingRole) {
    throw createError("roles.not_found", 404);
  }

  const usersCount = await roleRepository.countUsersByRoleId(id);

  if (usersCount > 0) {
    throw createError("roles.in_use", 400);
  }

  const affectedRows = await roleRepository.updateActiveStatus(id, 0);

  if (affectedRows === 0) {
    throw createError("roles.not_found", 404);
  }
}

async function activateRole(id) {
  const affectedRows = await roleRepository.updateActiveStatus(id, 1);

  if (affectedRows === 0) {
    throw createError("roles.not_found", 404);
  }
}

module.exports = {
  activateRole,
  createRole,
  deactivateRole,
  getRoleById,
  listRoles,
  listRolesByQuery,
  updateRole
};
