const { t } = require("../../utils/i18n");

function validateLoginPayload(payload = {}, locale) {
  const errors = [];
  const identifier = String(payload.identifier || "").trim();
  const password = String(payload.password || "");

  if (!identifier) {
    errors.push(t("auth.validation.identifier_required", locale));
  }

  if (!password.trim()) {
    errors.push(t("auth.validation.password_required", locale));
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: {
      identifier,
      password
    }
  };
}

module.exports = {
  validateLoginPayload
};
