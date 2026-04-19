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

function validateQuotationPayload(payload, locale) {
  const errors = [];
  const customerId = normalizeInteger(payload.customer_id);
  const insuranceType = normalizeInteger(payload.insurance_type);
  const hasClaims = normalizeBoolean(payload.has_claims);
  const hasInsurerPreference = normalizeBoolean(payload.has_insurer_preference);
  const manufactureYear = normalizeInteger(payload.manufacture_year);
  const driverAge = normalizeInteger(payload.driver_age);

  if (customerId === null) {
    errors.push(t("quotations.validation.customer_required", locale));
  }

  if (!payload.request_date) {
    errors.push(t("quotations.validation.request_date_required", locale));
  }

  if (insuranceType !== 0 && insuranceType !== 1) {
    errors.push(t("quotations.validation.insurance_type_invalid", locale));
  }

  if (insuranceType === 1 && (!payload.bonus_class || String(payload.bonus_class).trim() === "")) {
    errors.push(t("quotations.validation.bonus_class_required", locale));
  }

  if (insuranceType === 1 && hasClaims === null) {
    errors.push(t("quotations.validation.has_claims_required", locale));
  }

  if (!payload.vehicle_plate || String(payload.vehicle_plate).trim() === "") {
    errors.push(t("quotations.validation.vehicle_plate_required", locale));
  }

  if (!payload.vehicle_chassis || String(payload.vehicle_chassis).trim() === "") {
    errors.push(t("quotations.validation.vehicle_chassis_required", locale));
  }

  if (!payload.vehicle_brand || String(payload.vehicle_brand).trim() === "") {
    errors.push(t("quotations.validation.vehicle_brand_required", locale));
  }

  if (!payload.vehicle_model || String(payload.vehicle_model).trim() === "") {
    errors.push(t("quotations.validation.vehicle_model_required", locale));
  }

  if (manufactureYear === null) {
    errors.push(t("quotations.validation.manufacture_year_required", locale));
  }

  if (!payload.overnight_zipcode || String(payload.overnight_zipcode).trim() === "") {
    errors.push(t("quotations.validation.overnight_zipcode_required", locale));
  }

  if (driverAge === null) {
    errors.push(t("quotations.validation.driver_age_required", locale));
  }

  if (!payload.license_time || String(payload.license_time).trim() === "") {
    errors.push(t("quotations.validation.license_time_required", locale));
  }

  if (hasInsurerPreference === null) {
    errors.push(t("quotations.validation.insurer_preference_invalid", locale));
  }

  if (
    hasInsurerPreference === true &&
    (!payload.preferred_insurer || String(payload.preferred_insurer).trim() === "")
  ) {
    errors.push(t("quotations.validation.preferred_insurer_required", locale));
  }

  if (errors.length > 0) {
    return { errors };
  }

  const normalizedActive = normalizeBoolean(payload.active);

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
      active: normalizedActive === null ? 1 : normalizedActive ? 1 : 0
    }
  };
}

module.exports = {
  validateQuotationPayload
};
