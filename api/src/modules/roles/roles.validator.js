const { t } = require("../../utils/i18n");

function validateRolePayload(payload, locale) {
  const errors = [];

  if (!payload.name || String(payload.name).trim() === "") {
    errors.push(t("roles.validation.name_required", locale));
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
