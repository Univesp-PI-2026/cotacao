const assert = require("node:assert/strict");
const test = require("node:test");

const createApp = require("../src/app");
const userService = require("../src/modules/users/users.service");
const {
  buildAuthedRequest,
  buildJsonRequest,
  createTestServer,
  requestJson
} = require("./test-helpers");

const originalService = { ...userService };

function resetServiceMocks() {
  Object.assign(userService, originalService);
}

test.afterEach(() => {
  resetServiceMocks();
});

test.describe("users routes", () => {
  test("GET /v1/users returns users and total", async () => {
    userService.listUsers = async (query) => {
      assert.deepEqual(query, { active: "1" });

      return [
        {
          id: 10,
          name: "Maria",
          username: "maria",
          email: "maria@example.com",
          active: 1
        }
      ];
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users?active=1",
        buildAuthedRequest()
      );

      assert.equal(response.status, 200);
      assert.deepEqual(body, {
        data: [
          {
            id: 10,
            name: "Maria",
            username: "maria",
            email: "maria@example.com",
            active: 1
          }
        ],
        total: 1
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/users/count returns the total from the service", async () => {
    userService.countUsers = async (query) => {
      assert.deepEqual(query, { role_id: "3" });
      return 7;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/count?role_id=3",
        buildAuthedRequest()
      );

      assert.equal(response.status, 200);
      assert.deepEqual(body, { total: 7 });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/users/:id returns the requested user", async () => {
    userService.getUserById = async (id) => {
      assert.equal(id, "10");

      return {
        id: 10,
        role_id: 2,
        role_name: "manager",
        name: "Maria Silva",
        username: "maria.silva",
        email: "maria@example.com",
        active: 1
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/10",
        buildAuthedRequest()
      );

      assert.equal(response.status, 200);
      assert.deepEqual(body, {
        id: 10,
        role_id: 2,
        role_name: "manager",
        name: "Maria Silva",
        username: "maria.silva",
        email: "maria@example.com",
        active: 1
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/users validates and normalizes payload before creating", async () => {
    userService.createUser = async (payload) => {
      assert.deepEqual(payload, {
        role_id: 2,
        name: "Maria Silva",
        username: "maria.silva",
        email: "maria@example.com",
        password: "12345678",
        active: 1
      });

      return {
        id: 15,
        ...payload,
        password: undefined
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users",
        buildJsonRequest(
          {
            role_id: "2",
            name: "  Maria Silva  ",
            username: " Maria.Silva ",
            email: "Maria@Example.com",
            password: "12345678"
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 201);
      assert.equal(body.id, 15);
      assert.equal(body.username, "maria.silva");
      assert.equal(body.email, "maria@example.com");
    } finally {
      await server.close();
    }
  });

  test("POST /v1/users maps duplicate user errors to 400", async () => {
    userService.createUser = async () => {
      const error = new Error("duplicate");
      error.code = "ER_DUP_ENTRY";
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users",
        buildJsonRequest(
          {
            role_id: 2,
            name: "Maria Silva",
            username: "maria.silva",
            email: "maria@example.com",
            password: "12345678"
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["Ja existe um usuario com esse usuario ou email"]
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/users returns 400 when payload is invalid", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users",
        buildJsonRequest(
          {
            name: "",
            username: "ab",
            email: "email-invalido",
            role_id: "",
            password: "123"
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 400);
      assert.equal(body.message, "Dados invalidos");
      assert.deepEqual(body.errors, [
        "Nome e obrigatorio",
        "Usuario deve ter entre 3 e 30 caracteres e usar apenas letras, numeros, ponto, traco ou underscore",
        "Email invalido",
        "role_id e obrigatorio",
        "A senha deve ter pelo menos 8 caracteres"
      ]);
    } finally {
      await server.close();
    }
  });

  test("POST /v1/users returns 500 when the service fails unexpectedly", async () => {
    userService.createUser = async () => {
      throw new Error("unexpected create failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users",
        buildJsonRequest(
          {
            role_id: 2,
            name: "Maria Silva",
            username: "maria.silva",
            email: "maria@example.com",
            password: "12345678"
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao criar usuario",
        detail: "unexpected create failure"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/users/:id returns 404 when user does not exist", async () => {
    userService.getUserById = async () => {
      const error = new Error("users.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/999",
        buildAuthedRequest()
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Usuario nao encontrado" });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/users returns 500 when the service fails", async () => {
    userService.listUsers = async () => {
      throw new Error("unexpected list failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users",
        buildAuthedRequest()
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao listar usuarios",
        detail: "unexpected list failure"
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/users/:id returns 500 when the service fails unexpectedly", async () => {
    userService.getUserById = async () => {
      throw new Error("unexpected fetch failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/10",
        buildAuthedRequest()
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao buscar usuario",
        detail: "unexpected fetch failure"
      });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/users/:id updates and normalizes the payload", async () => {
    userService.updateUser = async (id, payload) => {
      assert.equal(id, "10");
      assert.deepEqual(payload, {
        role_id: 2,
        name: "Maria Silva",
        username: "maria.silva",
        email: "maria@example.com",
        password: null,
        active: 0
      });

      return {
        id: 10,
        ...payload,
        role_name: "manager"
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/10",
        buildJsonRequest(
          {
            role_id: "2",
            name: "  Maria Silva  ",
            username: " Maria.Silva ",
            email: "maria@example.com",
            password: "   ",
            active: false
          },
          { method: "PUT" }
        )
      );

      assert.equal(response.status, 200);
      assert.deepEqual(body, {
        id: 10,
        role_id: 2,
        name: "Maria Silva",
        username: "maria.silva",
        email: "maria@example.com",
        password: null,
        active: 0,
        role_name: "manager"
      });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/users/:id returns 404 when user does not exist", async () => {
    userService.updateUser = async () => {
      const error = new Error("users.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/999",
        buildJsonRequest(
          {
            role_id: 2,
            name: "Maria Silva",
            username: "maria.silva",
            email: "maria@example.com",
            active: true
          },
          { method: "PUT" }
        )
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Usuario nao encontrado" });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/users/:id returns 400 for business validation errors", async () => {
    userService.updateUser = async () => {
      const error = new Error("users.invalid_role");
      error.statusCode = 400;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/10",
        buildJsonRequest(
          {
            role_id: 999,
            name: "Maria Silva",
            username: "maria.silva",
            email: "maria@example.com",
            active: true
          },
          { method: "PUT" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["role_id invalido"]
      });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/users/:id maps duplicate user errors to 400", async () => {
    userService.updateUser = async () => {
      const error = new Error("duplicate");
      error.code = "ER_DUP_ENTRY";
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/10",
        buildJsonRequest(
          {
            role_id: 2,
            name: "Maria Silva",
            username: "maria.silva",
            email: "maria@example.com",
            active: true
          },
          { method: "PUT" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["Ja existe um usuario com esse usuario ou email"]
      });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/users/:id returns 500 when the service fails unexpectedly", async () => {
    userService.updateUser = async () => {
      throw new Error("unexpected update failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/10",
        buildJsonRequest(
          {
            role_id: 2,
            name: "Maria Silva",
            username: "maria.silva",
            email: "maria@example.com",
            active: true
          },
          { method: "PUT" }
        )
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao atualizar usuario",
        detail: "unexpected update failure"
      });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/users/:id deactivates the user", async () => {
    let receivedId = null;
    userService.deactivateUser = async (id) => {
      receivedId = id;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/10",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(receivedId, "10");
      assert.equal(response.status, 200);
      assert.deepEqual(body, { message: "Usuario desativado com sucesso" });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/users/:id returns 404 when user does not exist", async () => {
    userService.deactivateUser = async () => {
      const error = new Error("users.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/999",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Usuario nao encontrado" });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/users/:id returns business validation errors", async () => {
    userService.deactivateUser = async () => {
      const error = new Error("users.last_active_admin_required");
      error.statusCode = 400;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/1",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["Deve existir pelo menos um admin ativo"]
      });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/users/:id returns 500 when the service fails unexpectedly", async () => {
    userService.deactivateUser = async () => {
      throw new Error("unexpected deactivate failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/10",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao desativar usuario",
        detail: "unexpected deactivate failure"
      });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/users/:id/activate activates the user", async () => {
    let receivedId = null;
    userService.activateUser = async (id) => {
      receivedId = id;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/22/activate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(receivedId, "22");
      assert.equal(response.status, 200);
      assert.deepEqual(body, { message: "Usuario ativado com sucesso" });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/users/:id/activate returns 404 when user does not exist", async () => {
    userService.activateUser = async () => {
      const error = new Error("users.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/999/activate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Usuario nao encontrado" });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/users requires authentication", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(server, "/v1/users");

      assert.equal(response.status, 401);
      assert.deepEqual(body, { message: "Token não informado" });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/users returns messages in English when requested", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users",
        buildJsonRequest(
          {
            name: "",
            username: "ab",
            email: "invalid-email",
            role_id: "",
            password: "123"
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
          "Username must be 3 to 30 characters and use only letters, numbers, dot, dash, or underscore",
          "Email must be valid",
          "role_id is required",
          "Password must have at least 8 characters"
        ]
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/users/count returns 500 when the service fails", async () => {
    userService.countUsers = async () => {
      throw new Error("db offline");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/count",
        buildAuthedRequest()
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao listar usuarios",
        detail: "db offline"
      });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/users/:id/activate returns 500 for unexpected errors", async () => {
    userService.activateUser = async () => {
      throw new Error("unexpected activate failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/users/22/activate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao ativar usuario",
        detail: "unexpected activate failure"
      });
    } finally {
      await server.close();
    }
  });
});
