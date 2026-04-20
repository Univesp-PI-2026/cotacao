const { t } = require("../../utils/i18n");

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

function validateUserPayload(payload, options = {}, locale) {
  const errors = [];
  const requiresPassword = options.requiresPassword !== false;
  const normalizedRoleId = Number(payload.role_id);
  const username = String(payload.username || "").trim().toLowerCase();

  if (!payload.name || String(payload.name).trim() === "") {
    errors.push(t("users.validation.name_required", locale));
  }

  if (!username) {
    errors.push(t("users.validation.username_required", locale));
  } else if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    errors.push(t("users.validation.username_invalid", locale));
  }

  if (!payload.email || String(payload.email).trim() === "") {
    errors.push(t("users.validation.email_required", locale));
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) {
    errors.push(t("users.validation.email_invalid", locale));
  }

  if (!payload.role_id || Number.isNaN(normalizedRoleId) || normalizedRoleId <= 0) {
    errors.push(t("users.validation.role_required", locale));
  }

  if (requiresPassword && (!payload.password || String(payload.password).trim() === "")) {
    errors.push(t("users.validation.password_required", locale));
  }

  if (
    payload.password &&
    String(payload.password).trim().length > 0 &&
    String(payload.password).trim().length < 8
  ) {
    errors.push(t("users.validation.password_min_length", locale));
  }

  if (errors.length > 0) {
    return { errors };
  }

  const normalizedActive = normalizeBoolean(payload.active);
  const password =
    payload.password && String(payload.password).trim().length > 0
      ? String(payload.password)
      : null;

  return {
    data: {
      role_id: normalizedRoleId,
      name: String(payload.name).trim(),
      username,
      email: String(payload.email).trim().toLowerCase(),
      password,
      active: normalizedActive === null ? 1 : normalizedActive ? 1 : 0
    }
  };
}

module.exports = {
  validateUserPayload
};
