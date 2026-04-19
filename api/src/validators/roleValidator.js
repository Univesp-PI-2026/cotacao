function validateRolePayload(payload) {
  const errors = [];

  if (!payload.name || String(payload.name).trim() === "") {
    errors.push("name is required");
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: {
      name: String(payload.name).trim().toLowerCase()
    }
  };
}

module.exports = {
  validateRolePayload
};
