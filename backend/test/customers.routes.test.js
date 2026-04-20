const assert = require("node:assert/strict");
const test = require("node:test");

const createApp = require("../src/app");
const customerService = require("../src/modules/customers/customers.service");
const {
  buildAuthedRequest,
  buildJsonRequest,
  createTestServer,
  requestJson
} = require("./test-helpers");

const originalService = { ...customerService };

function resetServiceMocks() {
  Object.assign(customerService, originalService);
}

function buildBrazilianCustomerPayload(overrides = {}) {
  return {
    name: "Maria Silva",
    email: "maria@example.com",
    is_foreign: false,
    cpf: "12345678901",
    birth_date: "1990-05-10",
    zip_code: "88000-000",
    street: "Rua das Flores",
    number: "123",
    complement: "Apto 45",
    district: "Centro",
    city: "Florianopolis",
    state: "sc",
    active: true,
    ...overrides
  };
}

test.afterEach(() => {
  resetServiceMocks();
});

test.describe("customers routes", () => {
  test("GET /v1/customers returns customers and total", async () => {
    customerService.listCustomers = async (query) => {
      assert.deepEqual(query, { active: "1" });

      return [
        {
          id: 10,
          name: "Maria Silva",
          email: "maria@example.com",
          is_foreign: 0,
          cpf: "12345678901",
          active: 1
        }
      ];
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers?active=1",
        buildAuthedRequest()
      );

      assert.equal(response.status, 200);
      assert.deepEqual(body, {
        data: [
          {
            id: 10,
            name: "Maria Silva",
            email: "maria@example.com",
            is_foreign: 0,
            cpf: "12345678901",
            active: 1
          }
        ],
        total: 1
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/customers/count returns the total from the service", async () => {
    customerService.countCustomers = async (query) => {
      assert.deepEqual(query, { active: "0" });
      return 3;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/count?active=0",
        buildAuthedRequest()
      );

      assert.equal(response.status, 200);
      assert.deepEqual(body, { total: 3 });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/customers/:id returns the requested customer", async () => {
    customerService.getCustomerById = async (id) => {
      assert.equal(id, "10");

      return {
        id: 10,
        name: "Maria Silva",
        email: "maria@example.com",
        is_foreign: 0,
        cpf: "12345678901",
        rnm: null,
        birth_date: "1990-05-10",
        zip_code: "88000-000",
        street: "Rua das Flores",
        number: "123",
        complement: "Apto 45",
        district: "Centro",
        city: "Florianopolis",
        state: "SC",
        active: 1
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/10",
        buildAuthedRequest()
      );

      assert.equal(response.status, 200);
      assert.equal(body.id, 10);
      assert.equal(body.state, "SC");
    } finally {
      await server.close();
    }
  });

  test("POST /v1/customers validates and normalizes brazilian payload before creating", async () => {
    customerService.createCustomer = async (payload) => {
      assert.deepEqual(payload, {
        name: "Maria Silva",
        email: "maria@example.com",
        is_foreign: 0,
        cpf: "12345678901",
        rnm: null,
        birth_date: "1990-05-10",
        zip_code: "88000-000",
        street: "Rua das Flores",
        number: "123",
        complement: "Apto 45",
        district: "Centro",
        city: "Florianopolis",
        state: "SC",
        active: 1
      });

      return {
        id: 15,
        ...payload
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers",
        buildJsonRequest(
          buildBrazilianCustomerPayload({
            name: "  Maria Silva  ",
            email: "Maria@Example.com",
            state: "sc"
          }),
          { method: "POST" }
        )
      );

      assert.equal(response.status, 201);
      assert.equal(body.id, 15);
      assert.equal(body.email, "maria@example.com");
      assert.equal(body.state, "SC");
    } finally {
      await server.close();
    }
  });

  test("POST /v1/customers validates and normalizes foreign customer payload", async () => {
    customerService.createCustomer = async (payload) => {
      assert.deepEqual(payload, {
        name: "John Doe",
        email: "john@example.com",
        is_foreign: 1,
        cpf: null,
        rnm: "RNM123456",
        birth_date: "1985-01-20",
        zip_code: "01000-000",
        street: "Avenida Central",
        number: "999",
        complement: null,
        district: "Centro",
        city: "Sao Paulo",
        state: "SP",
        active: 1
      });

      return {
        id: 16,
        ...payload
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers",
        buildJsonRequest(
          {
            name: "John Doe",
            email: "john@example.com",
            is_foreign: true,
            rnm: "RNM123456",
            birth_date: "1985-01-20",
            zip_code: "01000-000",
            street: "Avenida Central",
            number: "999",
            district: "Centro",
            city: "Sao Paulo",
            state: "sp"
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 201);
      assert.equal(body.id, 16);
      assert.equal(body.is_foreign, 1);
      assert.equal(body.cpf, null);
      assert.equal(body.rnm, "RNM123456");
    } finally {
      await server.close();
    }
  });

  test("POST /v1/customers maps duplicate unique fields to 400", async () => {
    customerService.createCustomer = async () => {
      const error = new Error("duplicate");
      error.code = "ER_DUP_ENTRY";
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers",
        buildJsonRequest(buildBrazilianCustomerPayload(), { method: "POST" })
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["Email, CPF ou RNM ja existe"]
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/customers returns 400 when payload is invalid", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers",
        buildJsonRequest(
          {
            name: "",
            email: "email-invalido",
            is_foreign: "maybe",
            birth_date: "",
            zip_code: "",
            street: "",
            number: "",
            district: "",
            city: "",
            state: "",
            cpf: ""
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: [
          "Nome e obrigatorio",
          "Email invalido",
          "is_foreign deve ser booleano",
          "Data de nascimento e obrigatoria",
          "CEP e obrigatorio",
          "Rua e obrigatoria",
          "Numero e obrigatorio",
          "Bairro e obrigatorio",
          "Cidade e obrigatoria",
          "Estado e obrigatorio"
        ]
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/customers requires CPF for brazilian customers", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers",
        buildJsonRequest(
          buildBrazilianCustomerPayload({
            cpf: ""
          }),
          { method: "POST" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["CPF e obrigatorio quando is_foreign for falso"]
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/customers requires RNM for foreign customers", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers",
        buildJsonRequest(
          {
            ...buildBrazilianCustomerPayload(),
            is_foreign: true,
            cpf: null,
            rnm: ""
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["RNM e obrigatorio quando is_foreign for verdadeiro"]
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/customers returns 500 when the service fails", async () => {
    customerService.createCustomer = async () => {
      throw new Error("unexpected create failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers",
        buildJsonRequest(buildBrazilianCustomerPayload(), { method: "POST" })
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao criar cliente",
        detail: "unexpected create failure"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/customers/:id returns 404 when customer does not exist", async () => {
    customerService.getCustomerById = async () => {
      const error = new Error("customers.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/999",
        buildAuthedRequest()
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Cliente nao encontrado" });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/customers returns 500 when the service fails", async () => {
    customerService.listCustomers = async () => {
      throw new Error("unexpected list failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers",
        buildAuthedRequest()
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao listar clientes",
        detail: "unexpected list failure"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/customers/:id returns 500 when the service fails", async () => {
    customerService.getCustomerById = async () => {
      throw new Error("unexpected fetch failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/10",
        buildAuthedRequest()
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao buscar cliente",
        detail: "unexpected fetch failure"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/customers/count returns 500 when the service fails", async () => {
    customerService.countCustomers = async () => {
      throw new Error("db offline");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/count",
        buildAuthedRequest()
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao listar clientes",
        detail: "db offline"
      });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/customers/:id updates and normalizes the payload", async () => {
    customerService.updateCustomer = async (id, payload) => {
      assert.equal(id, "10");
      assert.deepEqual(payload, {
        name: "Maria Silva",
        email: "maria@example.com",
        is_foreign: 0,
        cpf: "12345678901",
        rnm: null,
        birth_date: "1990-05-10",
        zip_code: "88000-000",
        street: "Rua das Flores",
        number: "123",
        complement: "Apto 45",
        district: "Centro",
        city: "Florianopolis",
        state: "SC",
        active: 0
      });

      return {
        id: 10,
        ...payload
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/10",
        buildJsonRequest(
          buildBrazilianCustomerPayload({
            active: false
          }),
          { method: "PUT" }
        )
      );

      assert.equal(response.status, 200);
      assert.equal(body.id, 10);
      assert.equal(body.active, 0);
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/customers/:id returns 404 when customer does not exist", async () => {
    customerService.updateCustomer = async () => {
      const error = new Error("customers.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/999",
        buildJsonRequest(buildBrazilianCustomerPayload(), { method: "PUT" })
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Cliente nao encontrado" });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/customers/:id maps duplicate unique fields to 400", async () => {
    customerService.updateCustomer = async () => {
      const error = new Error("duplicate");
      error.code = "ER_DUP_ENTRY";
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/10",
        buildJsonRequest(buildBrazilianCustomerPayload(), { method: "PUT" })
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["Email, CPF ou RNM ja existe"]
      });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/customers/:id returns 500 when the service fails", async () => {
    customerService.updateCustomer = async () => {
      throw new Error("unexpected update failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/10",
        buildJsonRequest(buildBrazilianCustomerPayload(), { method: "PUT" })
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao atualizar cliente",
        detail: "unexpected update failure"
      });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/customers/:id deactivates the customer", async () => {
    let receivedId = null;
    customerService.deactivateCustomer = async (id) => {
      receivedId = id;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/10",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(receivedId, "10");
      assert.equal(response.status, 200);
      assert.deepEqual(body, { message: "Cliente desativado com sucesso" });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/customers/:id returns 404 when customer does not exist", async () => {
    customerService.deactivateCustomer = async () => {
      const error = new Error("customers.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/999",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Cliente nao encontrado" });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/customers/:id returns 500 when the service fails", async () => {
    customerService.deactivateCustomer = async () => {
      throw new Error("unexpected deactivate failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/10",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao desativar cliente",
        detail: "unexpected deactivate failure"
      });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/customers/:id/activate activates the customer", async () => {
    let receivedId = null;
    customerService.activateCustomer = async (id) => {
      receivedId = id;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/22/activate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(receivedId, "22");
      assert.equal(response.status, 200);
      assert.deepEqual(body, { message: "Cliente ativado com sucesso" });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/customers/:id/activate returns 404 when customer does not exist", async () => {
    customerService.activateCustomer = async () => {
      const error = new Error("customers.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/999/activate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Cliente nao encontrado" });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/customers/:id/activate returns 500 when the service fails", async () => {
    customerService.activateCustomer = async () => {
      throw new Error("unexpected activate failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/22/activate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao ativar cliente",
        detail: "unexpected activate failure"
      });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/customers/:id/deactivate deactivates the customer", async () => {
    let receivedId = null;
    customerService.deactivateCustomer = async (id) => {
      receivedId = id;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/33/deactivate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(receivedId, "33");
      assert.equal(response.status, 200);
      assert.deepEqual(body, { message: "Cliente desativado com sucesso" });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/customers/:id/deactivate returns 404 when customer does not exist", async () => {
    customerService.deactivateCustomer = async () => {
      const error = new Error("customers.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/999/deactivate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Cliente nao encontrado" });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/customers/:id/deactivate returns 500 when the service fails", async () => {
    customerService.deactivateCustomer = async () => {
      throw new Error("unexpected deactivate failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers/33/deactivate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao desativar cliente",
        detail: "unexpected deactivate failure"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/customers requires authentication", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(server, "/v1/customers");

      assert.equal(response.status, 401);
      assert.deepEqual(body, { message: "Token não informado" });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/customers returns messages in English when requested", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/customers",
        buildJsonRequest(
          {
            ...buildBrazilianCustomerPayload(),
            name: "",
            email: "invalid-email"
          },
          {
            method: "POST",
            headers: {
              "accept-language": "en-US"
            }
          }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Invalid data",
        errors: [
          "Name is required",
          "Email must be valid"
        ]
      });
    } finally {
      await server.close();
    }
  });
});
