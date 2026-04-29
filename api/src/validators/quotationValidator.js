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

function normalizeInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeCoverages(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function validateQuotationPayload(payload) {
  const errors = [];
  const customerId = normalizeInteger(payload.customer_id);
  const insuranceType = normalizeInteger(payload.insurance_type);
  const hasClaims = normalizeBoolean(payload.has_claims);
  const hasInsurerPreference = normalizeBoolean(payload.has_insurer_preference);
  const manufactureYear = normalizeInteger(payload.manufacture_year);
  const driverAge = normalizeInteger(payload.driver_age);

  if (customerId === null) {
    errors.push({ field: "customer_id", message: "Selecione um cliente." });
  }

  if (!payload.request_date) {
    errors.push({ field: "request_date", message: "Data da solicitacao e obrigatoria." });
  }

  if (insuranceType !== 0 && insuranceType !== 1) {
    errors.push({ field: "insurance_type", message: "Selecione um tipo de seguro valido." });
  }

  if (insuranceType === 1 && (!payload.bonus_class || String(payload.bonus_class).trim() === "")) {
    errors.push({ field: "bonus_class", message: "Classe de bonus e obrigatoria na renovacao." });
  }

  if (insuranceType === 1 && hasClaims === null) {
    errors.push({ field: "has_claims", message: "Informe se houve sinistros na renovacao." });
  }

  if (!payload.vehicle_plate || String(payload.vehicle_plate).trim() === "") {
    errors.push({ field: "vehicle_plate", message: "Placa e obrigatoria." });
  }

  if (!payload.vehicle_chassis || String(payload.vehicle_chassis).trim() === "") {
    errors.push({ field: "vehicle_chassis", message: "Chassi e obrigatorio." });
  }

  if (!payload.vehicle_brand || String(payload.vehicle_brand).trim() === "") {
    errors.push({ field: "vehicle_brand", message: "Marca e obrigatoria." });
  }

  if (!payload.vehicle_model || String(payload.vehicle_model).trim() === "") {
    errors.push({ field: "vehicle_model", message: "Modelo e obrigatorio." });
  }

  if (manufactureYear === null) {
    errors.push({ field: "manufacture_year", message: "Ano e obrigatorio." });
  }

  if (!payload.overnight_zipcode || String(payload.overnight_zipcode).trim() === "") {
    errors.push({ field: "overnight_zipcode", message: "CEP de pernoite e obrigatorio." });
  }

  if (driverAge === null) {
    errors.push({ field: "driver_age", message: "Idade do condutor e obrigatoria." });
  }

  if (!payload.license_time || String(payload.license_time).trim() === "") {
    errors.push({ field: "license_time", message: "Tempo de habilitacao e obrigatorio." });
  }

  if (hasInsurerPreference === null) {
    errors.push({ field: "has_insurer_preference", message: "Selecione uma opcao valida." });
  }

  if (hasInsurerPreference === true && (!payload.preferred_insurer || String(payload.preferred_insurer).trim() === "")) {
    errors.push({ field: "preferred_insurer", message: "Informe a seguradora preferida." });
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: {
      customer_id: customerId,
      request_date: payload.request_date,
      insurance_type: insuranceType,
      bonus_class: insuranceType === 1 ? String(payload.bonus_class).trim() : null,
      has_claims: insuranceType === 1 ? (hasClaims ? 1 : 0) : null,
      vehicle_plate: String(payload.vehicle_plate).trim().toUpperCase(),
      vehicle_chassis: String(payload.vehicle_chassis).trim().toUpperCase(),
      vehicle_brand: String(payload.vehicle_brand).trim(),
      vehicle_model: String(payload.vehicle_model).trim(),
      manufacture_year: manufactureYear,
      overnight_zipcode: String(payload.overnight_zipcode).trim(),
      driver_age: driverAge,
      license_time: String(payload.license_time).trim(),
      coverages: normalizeCoverages(payload.coverages),
      has_insurer_preference: hasInsurerPreference ? 1 : 0,
      preferred_insurer: hasInsurerPreference ? String(payload.preferred_insurer).trim() : null,
      active: normalizeBoolean(payload.active) === null ? 1 : normalizeBoolean(payload.active) ? 1 : 0
    }
  };
}

module.exports = {
  validateQuotationPayload
};
