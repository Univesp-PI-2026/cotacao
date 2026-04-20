const assert = require("node:assert/strict");
const test = require("node:test");

const createApp = require("../src/app");
const zipCodeService = require("../src/modules/zip-codes/zip-codes.service");
const {
  buildAuthedRequest,
  createTestServer,
  requestJson
} = require("./test-helpers");

const originalService = { ...zipCodeService };

test.afterEach(() => {
  Object.assign(zipCodeService, originalService);
});

test.describe("zip codes routes", () => {
  test("GET /v1/zip-codes/:zipCode returns normalized address data", async () => {
    zipCodeService.lookupZipCode = async (zipCode) => {
      assert.equal(zipCode, "01001-000");

      return {
        zip_code: "01001-000",
        street: "Praça da Sé",
        complement: "lado ímpar",
        district: "Sé",
        city: "São Paulo",
        state: "SP"
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/zip-codes/01001-000",
        buildAuthedRequest()
      );

      assert.equal(response.status, 200);
      assert.deepEqual(body, {
        zip_code: "01001-000",
        street: "Praça da Sé",
        complement: "lado ímpar",
        district: "Sé",
        city: "São Paulo",
        state: "SP"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/zip-codes/:zipCode returns 400 for invalid format", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/zip-codes/123",
        buildAuthedRequest()
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "CEP invalido"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/zip-codes/:zipCode returns 404 when zip code is not found", async () => {
    zipCodeService.lookupZipCode = async () => {
      const error = new Error("zip_codes.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/zip-codes/99999999",
        buildAuthedRequest()
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, {
        message: "CEP nao encontrado"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/zip-codes/:zipCode returns 502 when provider lookup fails", async () => {
    zipCodeService.lookupZipCode = async () => {
      const error = new Error("zip_codes.lookup_failed");
      error.statusCode = 502;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/zip-codes/01001000",
        buildAuthedRequest()
      );

      assert.equal(response.status, 502);
      assert.deepEqual(body, {
        message: "Falha ao consultar CEP"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/zip-codes/:zipCode requires authentication", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(server, "/v1/zip-codes/01001000");

      assert.equal(response.status, 401);
      assert.deepEqual(body, {
        message: "Token não informado"
      });
    } finally {
      await server.close();
    }
  });
});
