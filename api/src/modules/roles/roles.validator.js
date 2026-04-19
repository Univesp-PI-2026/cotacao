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

function validateRolePayload(payload, locale) {
  const errors = [];

  if (!payload.name || String(payload.name).trim() === "") {
    errors.push(t("roles.validation.name_required", locale));
  }

  if (errors.length > 0) {
    return { errors };
  }

  const normalizedActive = normalizeBoolean(payload.active);

  return {
    data: {
      name: String(payload.name).trim().toLowerCase(),
      active: normalizedActive === null ? 1 : normalizedActive ? 1 : 0
    }
  };
}

module.exports = {
  validateRolePayload
};
