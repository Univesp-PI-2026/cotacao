const assert = require("node:assert/strict");
const test = require("node:test");

const createApp = require("../src/app");
const quotationService = require("../src/modules/quotations/quotations.service");
const {
  buildAuthedRequest,
  buildJsonRequest,
  createTestServer,
  requestJson
} = require("./test-helpers");

const originalService = { ...quotationService };

function resetServiceMocks() {
  Object.assign(quotationService, originalService);
}

function buildQuotationPayload(overrides = {}) {
  return {
    customer_id: 10,
    request_date: "2026-04-19",
    insurance_type: 0,
    vehicle_plate: "abc1d23",
    vehicle_chassis: "9bwzzz377vt004251",
    vehicle_brand: "Volkswagen",
    vehicle_model: "Gol",
    manufacture_year: 2022,
    overnight_zipcode: "88000-000",
    driver_age: 35,
    license_time: "10 anos",
    coverages: ["comprehensive", "glass"],
    has_insurer_preference: false,
    active: true,
    ...overrides
  };
}

test.afterEach(() => {
  resetServiceMocks();
});

test.describe("quotations routes", () => {
  test("GET /v1/quotations returns quotations and total", async () => {
    quotationService.listQuotations = async (query) => {
      assert.deepEqual(query, { active: "1" });

      return [
        {
          id: 11,
          customer_id: 10,
          customer_name: "Maria Silva",
          insurance_type: 0,
          vehicle_plate: "ABC1D23",
          active: 1
        }
      ];
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations?active=1",
        buildAuthedRequest()
      );

      assert.equal(response.status, 200);
      assert.deepEqual(body, {
        data: [
          {
            id: 11,
            customer_id: 10,
            customer_name: "Maria Silva",
            insurance_type: 0,
            vehicle_plate: "ABC1D23",
            active: 1
          }
        ],
        total: 1
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/quotations/count returns the total from the service", async () => {
    quotationService.countQuotations = async (query) => {
      assert.deepEqual(query, { customer_id: "10" });
      return 4;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/count?customer_id=10",
        buildAuthedRequest()
      );

      assert.equal(response.status, 200);
      assert.deepEqual(body, { total: 4 });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/quotations/:id returns the requested quotation", async () => {
    quotationService.getQuotationById = async (id) => {
      assert.equal(id, "11");

      return {
        id: 11,
        customer_id: 10,
        customer_name: "Maria Silva",
        customer_email: "maria@example.com",
        request_date: "2026-04-19",
        insurance_type: 0,
        bonus_class: null,
        has_claims: null,
        vehicle_plate: "ABC1D23",
        vehicle_chassis: "9BWZZZ377VT004251",
        coverages: ["comprehensive", "glass"],
        has_insurer_preference: 0,
        preferred_insurer: null,
        active: 1
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/11",
        buildAuthedRequest()
      );

      assert.equal(response.status, 200);
      assert.equal(body.id, 11);
      assert.equal(body.vehicle_plate, "ABC1D23");
    } finally {
      await server.close();
    }
  });

  test("POST /v1/quotations validates and normalizes new policy payload", async () => {
    quotationService.createQuotation = async (payload) => {
      assert.deepEqual(payload, {
        customer_id: 10,
        request_date: "2026-04-19",
        insurance_type: 0,
        bonus_class: null,
        has_claims: null,
        vehicle_plate: "ABC1D23",
        vehicle_chassis: "9BWZZZ377VT004251",
        vehicle_brand: "Volkswagen",
        vehicle_model: "Gol",
        manufacture_year: 2022,
        overnight_zipcode: "88000-000",
        driver_age: 35,
        license_time: "10 anos",
        coverages: ["comprehensive", "glass"],
        has_insurer_preference: 0,
        preferred_insurer: null,
        active: 1
      });

      return {
        id: 30,
        ...payload
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations",
        buildJsonRequest(
          buildQuotationPayload({
            vehicle_plate: " abc1d23 ",
            vehicle_chassis: " 9bwzzz377vt004251 ",
            coverages: "comprehensive, glass"
          }),
          { method: "POST" }
        )
      );

      assert.equal(response.status, 201);
      assert.equal(body.id, 30);
      assert.equal(body.vehicle_plate, "ABC1D23");
      assert.deepEqual(body.coverages, ["comprehensive", "glass"]);
    } finally {
      await server.close();
    }
  });

  test("POST /v1/quotations validates and normalizes renewal payload", async () => {
    quotationService.createQuotation = async (payload) => {
      assert.deepEqual(payload, {
        customer_id: 10,
        request_date: "2026-04-19",
        insurance_type: 1,
        bonus_class: "Classe 5",
        has_claims: 1,
        vehicle_plate: "ABC1D23",
        vehicle_chassis: "9BWZZZ377VT004251",
        vehicle_brand: "Volkswagen",
        vehicle_model: "Gol",
        manufacture_year: 2022,
        overnight_zipcode: "88000-000",
        driver_age: 35,
        license_time: "10 anos",
        coverages: ["comprehensive"],
        has_insurer_preference: 1,
        preferred_insurer: "Porto",
        active: 1
      });

      return {
        id: 31,
        ...payload
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations",
        buildJsonRequest(
          buildQuotationPayload({
            insurance_type: 1,
            bonus_class: " Classe 5 ",
            has_claims: true,
            coverages: ["comprehensive"],
            has_insurer_preference: true,
            preferred_insurer: " Porto "
          }),
          { method: "POST" }
        )
      );

      assert.equal(response.status, 201);
      assert.equal(body.id, 31);
      assert.equal(body.has_claims, 1);
      assert.equal(body.preferred_insurer, "Porto");
    } finally {
      await server.close();
    }
  });

  test("POST /v1/quotations returns 400 when payload is invalid", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations",
        buildJsonRequest(
          {
            customer_id: "",
            request_date: "",
            insurance_type: 5,
            vehicle_plate: "",
            vehicle_chassis: "",
            vehicle_brand: "",
            vehicle_model: "",
            manufacture_year: "",
            overnight_zipcode: "",
            driver_age: "",
            license_time: "",
            has_insurer_preference: "maybe"
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: [
          "Data da solicitacao e obrigatoria",
          "insurance_type deve ser 0 ou 1",
          "Placa do veiculo e obrigatoria",
          "Chassi do veiculo e obrigatorio",
          "Marca do veiculo e obrigatoria",
          "Modelo do veiculo e obrigatorio",
          "CEP de pernoite e obrigatorio",
          "Tempo de habilitacao e obrigatorio",
          "has_insurer_preference deve ser booleano"
        ]
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/quotations requires renewal fields for insurance_type 1", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations",
        buildJsonRequest(
          buildQuotationPayload({
            insurance_type: 1,
            bonus_class: "",
            has_claims: null
          }),
          { method: "POST" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: [
          "Classe de bonus e obrigatoria para renovacao",
          "has_claims e obrigatorio para renovacao"
        ]
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/quotations requires preferred insurer when requested", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations",
        buildJsonRequest(
          buildQuotationPayload({
            has_insurer_preference: true,
            preferred_insurer: ""
          }),
          { method: "POST" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["Seguradora preferida e obrigatoria quando houver preferencia"]
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/quotations maps invalid customer to 400", async () => {
    quotationService.createQuotation = async () => {
      const error = new Error("quotations.invalid_customer");
      error.statusCode = 400;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations",
        buildJsonRequest(buildQuotationPayload(), { method: "POST" })
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["customer_id nao existe"]
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/quotations returns 500 when the service fails", async () => {
    quotationService.createQuotation = async () => {
      throw new Error("unexpected create failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations",
        buildJsonRequest(buildQuotationPayload(), { method: "POST" })
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao criar cotacao",
        detail: "unexpected create failure"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/quotations/:id returns 404 when quotation does not exist", async () => {
    quotationService.getQuotationById = async () => {
      const error = new Error("quotations.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/999",
        buildAuthedRequest()
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Cotacao nao encontrada" });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/quotations returns 500 when the service fails", async () => {
    quotationService.listQuotations = async () => {
      throw new Error("unexpected list failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations",
        buildAuthedRequest()
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao listar cotacoes",
        detail: "unexpected list failure"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/quotations/:id returns 500 when the service fails", async () => {
    quotationService.getQuotationById = async () => {
      throw new Error("unexpected fetch failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/11",
        buildAuthedRequest()
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao buscar cotacao",
        detail: "unexpected fetch failure"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/quotations/count returns 500 when the service fails", async () => {
    quotationService.countQuotations = async () => {
      throw new Error("db offline");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/count",
        buildAuthedRequest()
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao listar cotacoes",
        detail: "db offline"
      });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/quotations/:id updates and normalizes the payload", async () => {
    quotationService.updateQuotation = async (id, payload) => {
      assert.equal(id, "11");
      assert.deepEqual(payload, {
        customer_id: 10,
        request_date: "2026-04-19",
        insurance_type: 0,
        bonus_class: null,
        has_claims: null,
        vehicle_plate: "ABC1D23",
        vehicle_chassis: "9BWZZZ377VT004251",
        vehicle_brand: "Volkswagen",
        vehicle_model: "Gol",
        manufacture_year: 2022,
        overnight_zipcode: "88000-000",
        driver_age: 35,
        license_time: "10 anos",
        coverages: ["comprehensive", "glass"],
        has_insurer_preference: 0,
        preferred_insurer: null,
        active: 0
      });

      return {
        id: 11,
        ...payload
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/11",
        buildJsonRequest(
          buildQuotationPayload({
            active: false
          }),
          { method: "PUT" }
        )
      );

      assert.equal(response.status, 200);
      assert.equal(body.id, 11);
      assert.equal(body.active, 0);
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/quotations/:id returns 404 when quotation does not exist", async () => {
    quotationService.updateQuotation = async () => {
      const error = new Error("quotations.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/999",
        buildJsonRequest(buildQuotationPayload(), { method: "PUT" })
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Cotacao nao encontrada" });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/quotations/:id maps invalid customer to 400", async () => {
    quotationService.updateQuotation = async () => {
      const error = new Error("quotations.invalid_customer");
      error.statusCode = 400;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/11",
        buildJsonRequest(buildQuotationPayload(), { method: "PUT" })
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["customer_id nao existe"]
      });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/quotations/:id returns 500 when the service fails", async () => {
    quotationService.updateQuotation = async () => {
      throw new Error("unexpected update failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/11",
        buildJsonRequest(buildQuotationPayload(), { method: "PUT" })
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao atualizar cotacao",
        detail: "unexpected update failure"
      });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/quotations/:id deactivates the quotation", async () => {
    let receivedId = null;
    quotationService.deactivateQuotation = async (id) => {
      receivedId = id;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/11",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(receivedId, "11");
      assert.equal(response.status, 200);
      assert.deepEqual(body, { message: "Cotacao desativada com sucesso" });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/quotations/:id returns 404 when quotation does not exist", async () => {
    quotationService.deactivateQuotation = async () => {
      const error = new Error("quotations.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/999",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Cotacao nao encontrada" });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/quotations/:id returns 500 when the service fails", async () => {
    quotationService.deactivateQuotation = async () => {
      throw new Error("unexpected deactivate failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/11",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao desativar cotacao",
        detail: "unexpected deactivate failure"
      });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/quotations/:id/activate activates the quotation", async () => {
    let receivedId = null;
    quotationService.activateQuotation = async (id) => {
      receivedId = id;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/11/activate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(receivedId, "11");
      assert.equal(response.status, 200);
      assert.deepEqual(body, { message: "Cotacao ativada com sucesso" });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/quotations/:id/activate returns 404 when quotation does not exist", async () => {
    quotationService.activateQuotation = async () => {
      const error = new Error("quotations.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/999/activate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Cotacao nao encontrada" });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/quotations/:id/activate returns 500 when the service fails", async () => {
    quotationService.activateQuotation = async () => {
      throw new Error("unexpected activate failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations/11/activate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao ativar cotacao",
        detail: "unexpected activate failure"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/quotations requires authentication", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(server, "/v1/quotations");

      assert.equal(response.status, 401);
      assert.deepEqual(body, { message: "Token não informado" });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/quotations returns messages in English when requested", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/quotations",
        buildJsonRequest(
          {
            ...buildQuotationPayload(),
            customer_id: "",
            request_date: ""
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
        errors: ["Request date is required"]
      });
    } finally {
      await server.close();
    }
  });
});
