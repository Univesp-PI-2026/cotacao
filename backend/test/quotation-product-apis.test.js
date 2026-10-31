const assert = require("node:assert/strict");
const test = require("node:test");
const createApp = require("../src/app");
const quotationService = require("../src/modules/quotations/quotations.service");
const customerService = require("../src/modules/customers/customers.service");
const { createQuotationsService } = require("../src/modules/quotations/quotations.service");
const { createTestServer, requestJson, buildAuthedRequest, buildJsonRequest } = require("./test-helpers");

const originals = { quotations: { ...quotationService }, customers: { ...customerService } };
test.afterEach(() => {
  Object.assign(quotationService, originals.quotations);
  Object.assign(customerService, originals.customers);
});

const common = { customer_id: 1, request_date: "2026-10-31", active: true };
const payloads = {
  auto: { ...common, insurance_type: 0, has_insurer_preference: false,
    vehicle_plate: "ABC1234", vehicle_chassis: "9BW123", vehicle_brand: "Toyota", vehicle_model: "Corolla",
    manufacture_year: 2022, overnight_zipcode: "01310100", driver_age: 35, license_time: "10 anos" },
  home: { ...common, insurance_type: 0, has_insurer_preference: false,
    property_zipcode: "01310100", property_street: "Paulista", property_number: "100",
    property_district: "Bela Vista", property_city: "São Paulo", property_state: "SP" },
  credit_card: { ...common, monthly_income: 4500.75, occupation: "Professora" }
};

for (const [product, path] of [["auto", "auto"], ["home", "home"], ["credit_card", "credit-card"]]) {
  const url = `/v1/quotations/${path}`;

  test(`${path}: list and count enforce the route product`, async () => {
    quotationService.listQuotations = async (filters) => {
      assert.equal(filters.product, product);
      return [{ id: 1, product }];
    };
    quotationService.countQuotations = async (filters) => {
      assert.equal(filters.product, product);
      return 1;
    };
    const server = await createTestServer(createApp);
    try {
      const list = await requestJson(server, `${url}?product=other`, buildAuthedRequest());
      assert.equal(list.response.status, 200);
      assert.equal(list.body.data[0].product, product);
      const count = await requestJson(server, `${url}/count?product=other`, buildAuthedRequest());
      assert.deepEqual(count.body, { total: 1 });
    } finally { await server.close(); }
  });

  test(`${path}: create infers the product and rejects conflicting products`, async () => {
    let calls = 0;
    quotationService.createQuotation = async (data) => {
      calls++;
      assert.equal(data.product, product);
      return { id: 1, ...data };
    };
    const server = await createTestServer(createApp);
    try {
      const created = await requestJson(server, url, buildJsonRequest(payloads[product], { method: "POST" }));
      assert.equal(created.response.status, 201);
      assert.equal(created.body.product, product);
      const invalid = await requestJson(server, url,
        buildJsonRequest({ ...payloads[product], product: "other" }, { method: "POST" }));
      assert.equal(invalid.response.status, 400);
      assert.equal(calls, 1);
    } finally { await server.close(); }
  });

  test(`${path}: detail, update, deactivate and activate receive the product scope`, async () => {
    quotationService.getQuotationById = async (id, scope) => {
      assert.equal(scope, product);
      return { id: Number(id), product };
    };
    quotationService.updateQuotation = async (id, data, scope) => {
      assert.equal(scope, product);
      assert.equal(data.product, product);
      return { id: Number(id), ...data };
    };
    for (const method of ["deactivateQuotation", "activateQuotation"]) {
      quotationService[method] = async (_id, scope) => assert.equal(scope, product);
    }
    const server = await createTestServer(createApp);
    try {
      assert.equal((await requestJson(server, `${url}/1`, buildAuthedRequest())).response.status, 200);
      assert.equal((await requestJson(server, `${url}/1`,
        buildJsonRequest(payloads[product], { method: "PUT" }))).response.status, 200);
      assert.equal((await requestJson(server, `${url}/1`, buildAuthedRequest({ method: "DELETE" }))).response.status, 200);
      assert.equal((await requestJson(server, `${url}/1/activate`, buildAuthedRequest({ method: "PATCH" }))).response.status, 200);
      assert.equal((await requestJson(server, url)).response.status, 401);
    } finally { await server.close(); }
  });
}

test("service rejects editing a quotation through another product API", async () => {
  const service = createQuotationsService({
    findById: async () => ({ id: 1, product: "auto" }),
    update: async () => assert.fail("Wrong product must not be written")
  });
  await assert.rejects(service.getQuotationById(1, "home"), { statusCode: 404 });
  await assert.rejects(service.updateQuotation(1, payloads.home, "home"), { statusCode: 404 });
});

test("segurados API shares the existing insured records and requires authentication", async () => {
  customerService.listCustomers = async () => [{ id: 1, name: "Segurado" }];
  const server = await createTestServer(createApp);
  try {
    const canonical = await requestJson(server, "/v1/insureds", buildAuthedRequest());
    const alias = await requestJson(server, "/v1/customers", buildAuthedRequest());
    assert.equal(canonical.response.status, 200);
    assert.deepEqual(canonical.body, alias.body);
    assert.equal((await requestJson(server, "/v1/insureds")).response.status, 401);
  } finally { await server.close(); }
});
