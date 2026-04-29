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
    errors.push({ field: "name", message: "Nome e obrigatorio." });
  }

  if (!payload.email || String(payload.email).trim() === "") {
    errors.push({ field: "email", message: "E-mail e obrigatorio." });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) {
    errors.push({ field: "email", message: "Informe um e-mail valido." });
  }

  if (isForeign === null) {
    errors.push({ field: "is_foreign", message: "Selecione uma opcao valida." });
  }

  if (!payload.birth_date) {
    errors.push({ field: "birth_date", message: "Data de nascimento e obrigatoria." });
  }

  if (!payload.zip_code || String(payload.zip_code).trim() === "") {
    errors.push({ field: "zip_code", message: "CEP e obrigatorio." });
  }

  if (!payload.street || String(payload.street).trim() === "") {
    errors.push({ field: "street", message: "Rua e obrigatoria." });
  }

  if (!payload.number || String(payload.number).trim() === "") {
    errors.push({ field: "number", message: "Numero e obrigatorio." });
  }

  if (!payload.district || String(payload.district).trim() === "") {
    errors.push({ field: "district", message: "Bairro e obrigatorio." });
  }

  if (!payload.city || String(payload.city).trim() === "") {
    errors.push({ field: "city", message: "Cidade e obrigatoria." });
  }

  if (!payload.state || String(payload.state).trim() === "") {
    errors.push({ field: "state", message: "Estado e obrigatorio." });
  } else if (String(payload.state).trim().length !== 2) {
    errors.push({ field: "state", message: "Estado deve ter 2 caracteres." });
  }

  if (isForeign === false && (!payload.cpf || String(payload.cpf).trim() === "")) {
    errors.push({ field: "cpf", message: "CPF e obrigatorio para clientes brasileiros." });
  }

  if (isForeign === true && (!payload.rnm || String(payload.rnm).trim() === "")) {
    errors.push({ field: "rnm", message: "RNM e obrigatorio para clientes estrangeiros." });
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
