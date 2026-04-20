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

function validateCustomerPayload(payload, locale) {
  const errors = [];
  const isForeign = normalizeBoolean(payload.is_foreign);

  if (!payload.name || String(payload.name).trim() === "") {
    errors.push(t("customers.validation.name_required", locale));
  }

  if (!payload.email || String(payload.email).trim() === "") {
    errors.push(t("customers.validation.email_required", locale));
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) {
    errors.push(t("customers.validation.email_invalid", locale));
  }

  if (isForeign === null) {
    errors.push(t("customers.validation.is_foreign_invalid", locale));
  }

  if (!payload.birth_date) {
    errors.push(t("customers.validation.birth_date_required", locale));
  }

  if (!payload.zip_code || String(payload.zip_code).trim() === "") {
    errors.push(t("customers.validation.zip_code_required", locale));
  }

  if (!payload.street || String(payload.street).trim() === "") {
    errors.push(t("customers.validation.street_required", locale));
  }

  if (!payload.number || String(payload.number).trim() === "") {
    errors.push(t("customers.validation.number_required", locale));
  }

  if (!payload.district || String(payload.district).trim() === "") {
    errors.push(t("customers.validation.district_required", locale));
  }

  if (!payload.city || String(payload.city).trim() === "") {
    errors.push(t("customers.validation.city_required", locale));
  }

  if (!payload.state || String(payload.state).trim() === "") {
    errors.push(t("customers.validation.state_required", locale));
  }

  if (isForeign === false && (!payload.cpf || String(payload.cpf).trim() === "")) {
    errors.push(t("customers.validation.cpf_required", locale));
  }

  if (isForeign === true && (!payload.rnm || String(payload.rnm).trim() === "")) {
    errors.push(t("customers.validation.rnm_required", locale));
  }

  if (errors.length > 0) {
    return { errors };
  }

  const normalizedActive = normalizeBoolean(payload.active);

  return {
    data: {
      name: String(payload.name).trim(),
      email: String(payload.email).trim().toLowerCase(),
      is_foreign: isForeign ? 1 : 0,
      cpf: isForeign ? null : (payload.cpf ? String(payload.cpf).trim() : null),
      rnm: isForeign ? String(payload.rnm).trim() : null,
      birth_date: payload.birth_date,
      zip_code: String(payload.zip_code).trim(),
      street: String(payload.street).trim(),
      number: String(payload.number).trim(),
      complement: payload.complement ? String(payload.complement).trim() : null,
      district: String(payload.district).trim(),
      city: String(payload.city).trim(),
      state: String(payload.state).trim().toUpperCase(),
      active: normalizedActive === null ? 1 : normalizedActive ? 1 : 0
    }
  };
}

module.exports = {
  validateCustomerPayload
};
