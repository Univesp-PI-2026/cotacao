const roleRepository = require("./roles.repository");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function listRoles() {
  return roleRepository.findAll();
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

  await roleRepository.update(id, data);
  return roleRepository.findById(id);
}

async function deleteRole(id) {
  const existingRole = await roleRepository.findById(id);

  if (!existingRole) {
    throw createError("roles.not_found", 404);
  }

  const usersCount = await roleRepository.countUsersByRoleId(id);

  if (usersCount > 0) {
    throw createError("roles.in_use", 400);
  }

  await roleRepository.remove(id);
}

module.exports = {
  createRole,
  deleteRole,
  getRoleById,
  listRoles,
  updateRole
};
