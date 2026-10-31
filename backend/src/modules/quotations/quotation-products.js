const insuranceFields = ["insurance_type", "has_claims", "coverages", "has_insurer_preference", "preferred_insurer"];

// Os nomes de tabelas e colunas usados no SQL vêm exclusivamente desta lista.
const products = {
  auto: {
    table: "quotation_auto",
    alias: "qa",
    fields: [...insuranceFields, "bonus_class", "vehicle_plate", "vehicle_chassis", "vehicle_brand",
      "vehicle_model", "manufacture_year", "overnight_zipcode", "driver_age", "license_time"]
  },
  home: {
    table: "quotation_home",
    alias: "qh",
    fields: [...insuranceFields, "property_zipcode", "property_street", "property_number",
      "property_complement", "property_district", "property_city", "property_state"]
  },
  credit_card: {
    table: "quotation_credit_card",
    alias: "qc",
    fields: ["monthly_income", "occupation"]
  }
};

module.exports = { products };
