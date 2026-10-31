const assert = require("node:assert/strict");
const test = require("node:test");
const createApp = require("../src/app");
const customers = require("../src/modules/customers/customers.service");
const users = require("../src/modules/users/users.service");
const { buildJsonRequest, createTestServer, requestJson } = require("./test-helpers");

const originalCustomers = { ...customers };
const originalUsers = { ...users };
test.afterEach(() => {
  Object.assign(customers, originalCustomers);
  Object.assign(users, originalUsers);
});

function failWithDuplicate(index) {
  return async () => {
    const error = new Error(`Duplicate entry 'dado-privado' for key '${index}'`);
    error.code = "ER_DUP_ENTRY";
    error.sqlMessage = error.message;
    throw error;
  };
}

for (const [method, serviceMethod] of [["POST", "createCustomer"], ["PUT", "updateCustomer"]]) {
  for (const [field, label] of [["email", "e-mail"], ["cpf", "CPF"], ["rnm", "RNM"]]) {
    test(`${method} insureds identifies duplicate ${field} without exposing database data`, async () => {
      customers[serviceMethod] = failWithDuplicate(`customers.uq_customers_${field}`);
      const server = await createTestServer(createApp);
      try {
        const { response, body } = await requestJson(server,
          method === "POST" ? "/v1/insureds" : "/v1/insureds/10",
          buildJsonRequest({
            name: "Teste", email: "teste@example.test", is_foreign: field === "rnm",
            cpf: "12345678901", rnm: "RNM123456", birth_date: "1990-05-10",
            zip_code: "01310100", street: "Avenida Paulista", number: "100",
            district: "Bela Vista", city: "São Paulo", state: "SP"
          }, { method }));
        assert.equal(response.status, 400);
        assert.deepEqual(body, {
          message: "Dados invalidos",
          errors: [`Este ${label} já está cadastrado para outro cliente.`]
        });
        assert.equal(JSON.stringify(body).includes("dado-privado"), false);
        assert.equal(JSON.stringify(body).includes("uq_customers"), false);
      } finally {
        await server.close();
      }
    });
  }
}

for (const [method, serviceMethod] of [["POST", "createUser"], ["PUT", "updateUser"]]) {
  test(`${method} users identifies duplicate email`, async () => {
    users[serviceMethod] = failWithDuplicate("users.uq_users_email");
    const server = await createTestServer(createApp);
    try {
      const { response, body } = await requestJson(server,
        method === "POST" ? "/v1/users" : "/v1/users/10",
        buildJsonRequest({ role_id: 2, name: "Teste", username: "teste",
          email: "teste@example.test", password: "12345678" }, { method }));
      assert.equal(response.status, 400);
      assert.deepEqual(body.errors, ["Este e-mail já está cadastrado para outro usuário."]);
    } finally {
      await server.close();
    }
  });
}
