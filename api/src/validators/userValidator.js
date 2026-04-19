function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === 1 || value === "1" || value === "true") {
    return true;
  }

  if (value === 0 || value === "0" || value === "false") {
    return false;
  }

  return null;
}

function validateUserPayload(payload, options = {}) {
  const errors = [];
  const requiresPassword = options.requiresPassword !== false;
  const normalizedRoleId = Number(payload.role_id);

  if (!payload.name || String(payload.name).trim() === "") {
    errors.push("name is required");
  }

  if (!payload.email || String(payload.email).trim() === "") {
    errors.push("email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) {
    errors.push("email must be valid");
  }

  if (!payload.role_id || Number.isNaN(normalizedRoleId) || normalizedRoleId <= 0) {
    errors.push("role_id is required");
  }

  if (requiresPassword && (!payload.password || String(payload.password).trim() === "")) {
    errors.push("password is required");
  }

  if (payload.password && String(payload.password).trim().length > 0 && String(payload.password).trim().length < 8) {
    errors.push("password must have at least 8 characters");
  }

  if (errors.length > 0) {
    return { errors };
  }

  const normalizedActive = normalizeBoolean(payload.active);
  const password = payload.password && String(payload.password).trim().length > 0
    ? String(payload.password)
    : null;

  return {
    data: {
      role_id: normalizedRoleId,
      name: String(payload.name).trim(),
      email: String(payload.email).trim().toLowerCase(),
      password,
      active: normalizedActive === null ? 1 : normalizedActive ? 1 : 0
    }
  };
}

module.exports = {
  validateUserPayload
};
