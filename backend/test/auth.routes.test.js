const assert = require("node:assert/strict");
const test = require("node:test");

const createApp = require("../src/app");
const authService = require("../src/modules/auth/auth.service");
const { buildJsonRequest, createTestServer, requestJson } = require("./test-helpers");

const originalService = { ...authService };

function resetServiceMocks() {
  Object.assign(authService, originalService);
}

test.afterEach(() => {
  resetServiceMocks();
});

test.describe("auth routes", () => {
  test("POST /v1/auth/login authenticates the user", async () => {
    authService.login = async (identifier, password) => {
      assert.equal(identifier, "maria@example.com");
      assert.equal(password, "12345678");

      return {
        token: "jwt-token",
        user: {
          id: 1,
          role_id: 1,
          role_name: "admin",
          name: "Maria Silva",
          username: "maria",
          email: "maria@example.com",
          active: 1
        }
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/auth/login",
        buildJsonRequest(
          {
            identifier: "  maria@example.com  ",
            password: "12345678"
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 200);
      assert.equal(body.token, "jwt-token");
      assert.equal(body.user.email, "maria@example.com");
    } finally {
      await server.close();
    }
  });

  test("POST /v1/auth/login returns 400 when payload is invalid", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/auth/login",
        buildJsonRequest(
          {
            identifier: "",
            password: "   "
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: [
          "Informe o usuário ou e-mail",
          "Informe a senha"
        ]
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/auth/login returns 401 for invalid credentials", async () => {
    authService.login = async () => {
      const error = new Error("auth.invalid_credentials");
      error.statusCode = 401;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/auth/login",
        buildJsonRequest(
          {
            identifier: "maria@example.com",
            password: "senha-incorreta"
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 401);
      assert.deepEqual(body, {
        message: "Usuário, e-mail ou senha inválidos"
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/auth/login returns 403 when the service forbids login", async () => {
    authService.login = async () => {
      const error = new Error("auth.inactive_user");
      error.statusCode = 403;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/auth/login",
        buildJsonRequest(
          {
            identifier: "maria@example.com",
            password: "12345678"
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 403);
      assert.deepEqual(body, {
        message: "Seu usuário está inativo"
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/auth/login returns 500 when the service fails", async () => {
    authService.login = async () => {
      throw new Error("unexpected login failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/auth/login",
        buildJsonRequest(
          {
            identifier: "maria@example.com",
            password: "12345678"
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Não foi possível autenticar",
        detail: "unexpected login failure"
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/auth/login returns messages in English when requested", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/auth/login",
        buildJsonRequest(
          {
            identifier: "",
            password: ""
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
          "Enter your username or email",
          "Enter your password"
        ]
      });
    } finally {
      await server.close();
    }
  });
});
