const assert = require("node:assert/strict");
const test = require("node:test");
const { validateQuotationPayload } = require("../src/modules/quotations/quotations.validator");
const createApp = require("../src/app");
const quotationService = require("../src/modules/quotations/quotations.service");
const { createTestServer, requestJson, buildJsonRequest } = require("./test-helpers");

const common = { customer_id: 10, request_date: "2026-10-31", active: true };
const home = {
  ...common, product: "home", insurance_type: 0, has_insurer_preference: false,
  property_zipcode: "01310-100", property_street: " Avenida Paulista ", property_number: "100",
  property_complement: "Apto 12", property_district: "Bela Vista", property_city: "São Paulo", property_state: "sp"
};
const card = { ...common, product: "credit_card", monthly_income: "4500.75", occupation: " Professora " };

test("home accepts an address without requiring vehicle or driver fields", () => {
  const { data, errors } = validateQuotationPayload(home, "pt-BR");
  assert.equal(errors, undefined);
  assert.equal(data.property_zipcode, "01310100");
  assert.equal(data.property_street, "Avenida Paulista");
  assert.equal(data.property_state, "SP");
  assert.equal(data.vehicle_plate, null);
  assert.equal(data.driver_age, null);
  assert.equal(data.monthly_income, null);
});

test("home renewal requires claims information, without an automobile bonus class", () => {
  const missing = validateQuotationPayload({ ...home, insurance_type: 1 }, "en");
  assert.deepEqual(missing.errors, ["has_claims is required for renewal"]);
  const { data } = validateQuotationPayload({ ...home, insurance_type: 1, has_claims: false }, "en");
  assert.equal(data.has_claims, 0);
  assert.equal(data.bonus_class, null);
});

test("home rejects incomplete addresses, invalid state codes and oversized fields", () => {
  for (const overrides of [
    { property_zipcode: "123" }, { property_street: "   " }, { property_number: "" },
    { property_district: "" }, { property_city: "" }, { property_state: "ZZ" },
    { property_complement: "a".repeat(256) }, { property_number: "a".repeat(31) }
  ]) {
    assert.ok(validateQuotationPayload({ ...home, ...overrides }, "pt-BR").errors, JSON.stringify(overrides));
  }
});

test("credit card accepts income and occupation and clears data from other products", () => {
  const { data, errors } = validateQuotationPayload({
    ...home, ...card, vehicle_plate: "ABC1234", insurance_type: 1, bonus_class: "7",
    has_claims: true, has_insurer_preference: true, preferred_insurer: "Porto", coverages: ["incendio"]
  }, "pt-BR");
  assert.equal(errors, undefined);
  assert.equal(data.monthly_income, 4500.75);
  assert.equal(data.occupation, "Professora");
  for (const field of ["insurance_type", "bonus_class", "has_claims", "vehicle_plate", "property_street", "preferred_insurer"]) {
    assert.equal(data[field], null, field);
  }
  assert.equal(data.has_insurer_preference, 0);
  assert.deepEqual(data.coverages, []);
});

test("credit card rejects missing, negative, oversized or overprecise income", () => {
  for (const monthly_income of [undefined, null, "", " ", 0, -1, "NaN", "Infinity", "1e3", "12,34", 1.234, 100000000000]) {
    assert.ok(validateQuotationPayload({ ...card, monthly_income }, "en").errors, String(monthly_income));
  }
  for (const occupation of [undefined, " ", "a".repeat(256)]) {
    assert.ok(validateQuotationPayload({ ...card, occupation }, "en").errors);
  }
});

test("unknown products are rejected", () => {
  assert.ok(validateQuotationPayload({ ...card, product: "travel" }, "en").errors.includes("Product must be auto, home, or credit_card"));
});

const original = { ...quotationService };
test.afterEach(() => Object.assign(quotationService, original));

for (const payload of [home, card]) {
  for (const method of ["POST", "PUT"]) {
    test(`${method} quotations accepts and returns ${payload.product} fields`, async () => {
      let saved;
      quotationService.createQuotation = async (data) => { saved = data; return { id: 42, ...data }; };
      quotationService.updateQuotation = async (_id, data) => { saved = data; return { id: 42, ...data }; };
      const server = await createTestServer(createApp);
      try {
        const { response, body } = await requestJson(server, method === "POST" ? "/v1/quotations" : "/v1/quotations/42",
          buildJsonRequest(payload, { method }));
        assert.equal(response.status, method === "POST" ? 201 : 200);
        assert.equal(saved.product, payload.product);
        assert.equal(body.product, payload.product);
        assert.equal(body.vehicle_plate, null);
        if (payload.product === "home") assert.equal(body.property_city, "São Paulo");
        else assert.equal(body.monthly_income, 4500.75);
      } finally {
        await server.close();
      }
    });
  }
}
