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
  const product = payload.product === undefined ? "auto" : payload.product;
  const isAuto = product === "auto";
  const isHome = product === "home";
  const isInsurance = isAuto || isHome;
  const isCreditCard = product === "credit_card";
  const customerId = normalizeInteger(payload.customer_id);
  const insuranceType = normalizeInteger(payload.insurance_type);
  const hasClaims = normalizeBoolean(payload.has_claims);
  const hasInsurerPreference = normalizeBoolean(payload.has_insurer_preference);
  const manufactureYear = normalizeInteger(payload.manufacture_year);
  const driverAge = normalizeInteger(payload.driver_age);

  if (!["auto", "home", "credit_card"].includes(product)) {
    errors.push(t("quotations.validation.product_invalid", locale));
  }

  if (customerId === null) {
    errors.push(t("quotations.validation.customer_required", locale));
  }

  if (!payload.request_date) {
    errors.push(t("quotations.validation.request_date_required", locale));
  }

  if (isInsurance && insuranceType !== 0 && insuranceType !== 1) {
    errors.push(t("quotations.validation.insurance_type_invalid", locale));
  }

  if (isAuto && insuranceType === 1 && (!payload.bonus_class || String(payload.bonus_class).trim() === "")) {
    errors.push(t("quotations.validation.bonus_class_required", locale));
  }

  if (isInsurance && insuranceType === 1 && hasClaims === null) {
    errors.push(t("quotations.validation.has_claims_required", locale));
  }

  if (isAuto && (!payload.vehicle_plate || String(payload.vehicle_plate).trim() === "")) {
    errors.push(t("quotations.validation.vehicle_plate_required", locale));
  }

  if (isAuto && (!payload.vehicle_chassis || String(payload.vehicle_chassis).trim() === "")) {
    errors.push(t("quotations.validation.vehicle_chassis_required", locale));
  }

  if (isAuto && (!payload.vehicle_brand || String(payload.vehicle_brand).trim() === "")) {
    errors.push(t("quotations.validation.vehicle_brand_required", locale));
  }

  if (isAuto && (!payload.vehicle_model || String(payload.vehicle_model).trim() === "")) {
    errors.push(t("quotations.validation.vehicle_model_required", locale));
  }

  if (isAuto && manufactureYear === null) {
    errors.push(t("quotations.validation.manufacture_year_required", locale));
  }

  if (isAuto && (!payload.overnight_zipcode || String(payload.overnight_zipcode).trim() === "")) {
    errors.push(t("quotations.validation.overnight_zipcode_required", locale));
  }

  if (isAuto && driverAge === null) {
    errors.push(t("quotations.validation.driver_age_required", locale));
  }

  if (isAuto && (!payload.license_time || String(payload.license_time).trim() === "")) {
    errors.push(t("quotations.validation.license_time_required", locale));
  }

  if (isInsurance && hasInsurerPreference === null) {
    errors.push(t("quotations.validation.insurer_preference_invalid", locale));
  }

  if (
    isInsurance && hasInsurerPreference === true &&
    (!payload.preferred_insurer || String(payload.preferred_insurer).trim() === "")
  ) {
    errors.push(t("quotations.validation.preferred_insurer_required", locale));
  }

  const address = {};
  if (isHome) {
    const requiredFields = {
      property_street: 255, property_number: 30, property_district: 120, property_city: 120
    };
    for (const [field, maxLength] of Object.entries(requiredFields)) {
      address[field] = String(payload[field] ?? "").trim();
      if (!address[field] || address[field].length > maxLength) {
        errors.push(t(`quotations.validation.${field}_invalid`, locale));
      }
    }
    address.property_zipcode = String(payload.property_zipcode ?? "").replace(/\D/g, "");
    address.property_state = String(payload.property_state ?? "").trim().toUpperCase();
    address.property_complement = String(payload.property_complement ?? "").trim() || null;
    if (!/^\d{8}$/.test(address.property_zipcode)) {
      errors.push(t("quotations.validation.property_zipcode_invalid", locale));
    }
    if (!["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
      "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].includes(address.property_state)) {
      errors.push(t("quotations.validation.property_state_invalid", locale));
    }
    if (address.property_complement?.length > 255) {
      errors.push(t("quotations.validation.property_complement_invalid", locale));
    }
  }

  const income = String(payload.monthly_income ?? "").trim();
  const occupation = String(payload.occupation ?? "").trim();
  if (isCreditCard) {
    if (!/^\d{1,11}(\.\d{1,2})?$/.test(income) || Number(income) <= 0) {
      errors.push(t("quotations.validation.monthly_income_invalid", locale));
    }
    if (!occupation || occupation.length > 255) {
      errors.push(t("quotations.validation.occupation_invalid", locale));
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  const normalizedActive = normalizeBoolean(payload.active);

  return {
    data: {
      customer_id: customerId,
      product,
      request_date: payload.request_date,
      insurance_type: isInsurance ? insuranceType : null,
      bonus_class: isAuto && insuranceType === 1 ? String(payload.bonus_class).trim() : null,
      has_claims: isInsurance && insuranceType === 1 ? (hasClaims ? 1 : 0) : null,
      vehicle_plate: isAuto ? String(payload.vehicle_plate).trim().toUpperCase() : null,
      vehicle_chassis: isAuto ? String(payload.vehicle_chassis).trim().toUpperCase() : null,
      vehicle_brand: isAuto ? String(payload.vehicle_brand).trim() : null,
      vehicle_model: isAuto ? String(payload.vehicle_model).trim() : null,
      manufacture_year: isAuto ? manufactureYear : null,
      overnight_zipcode: isAuto ? String(payload.overnight_zipcode).trim() : null,
      driver_age: isAuto ? driverAge : null,
      license_time: isAuto ? String(payload.license_time).trim() : null,
      coverages: isInsurance ? normalizeCoverages(payload.coverages) : [],
      has_insurer_preference: isInsurance && hasInsurerPreference ? 1 : 0,
      preferred_insurer: isInsurance && hasInsurerPreference ? String(payload.preferred_insurer).trim() : null,
      property_zipcode: address.property_zipcode ?? null,
      property_street: address.property_street ?? null,
      property_number: address.property_number ?? null,
      property_complement: address.property_complement ?? null,
      property_district: address.property_district ?? null,
      property_city: address.property_city ?? null,
      property_state: address.property_state ?? null,
      monthly_income: isCreditCard ? Number(income) : null,
      occupation: isCreditCard ? occupation : null,
      active: normalizedActive === null ? 1 : normalizedActive ? 1 : 0
    }
  };
}

module.exports = {
  validateQuotationPayload
};
