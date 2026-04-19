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

function validateCustomerPayload(payload) {
  const errors = [];
  const isForeign = normalizeBoolean(payload.is_foreign);

  if (!payload.name || String(payload.name).trim() === "") {
    errors.push("name is required");
  }

  if (!payload.email || String(payload.email).trim() === "") {
    errors.push("email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) {
    errors.push("email must be valid");
  }

  if (isForeign === null) {
    errors.push("is_foreign must be boolean");
  }

  if (!payload.birth_date) {
    errors.push("birth_date is required");
  }

  if (!payload.zip_code || String(payload.zip_code).trim() === "") {
    errors.push("zip_code is required");
  }

  if (!payload.street || String(payload.street).trim() === "") {
    errors.push("street is required");
  }

  if (!payload.number || String(payload.number).trim() === "") {
    errors.push("number is required");
  }

  if (!payload.district || String(payload.district).trim() === "") {
    errors.push("district is required");
  }

  if (!payload.city || String(payload.city).trim() === "") {
    errors.push("city is required");
  }

  if (!payload.state || String(payload.state).trim() === "") {
    errors.push("state is required");
  }

  if (isForeign === false && (!payload.cpf || String(payload.cpf).trim() === "")) {
    errors.push("cpf is required when is_foreign is false");
  }

  if (isForeign === true && (!payload.rnm || String(payload.rnm).trim() === "")) {
    errors.push("rnm is required when is_foreign is true");
  }

  if (errors.length > 0) {
    return { errors };
  }

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
      active: normalizeBoolean(payload.active) === null ? 1 : normalizeBoolean(payload.active) ? 1 : 0
    }
  };
}

module.exports = {
  validateCustomerPayload
};
