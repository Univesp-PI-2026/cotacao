const assert = require("node:assert/strict");
const test = require("node:test");

const createApp = require("../src/app");
const roleService = require("../src/modules/roles/roles.service");
const {
  buildAuthedRequest,
  buildJsonRequest,
  createTestServer,
  requestJson
} = require("./test-helpers");

const originalService = { ...roleService };

function resetServiceMocks() {
  Object.assign(roleService, originalService);
}

test.afterEach(() => {
  resetServiceMocks();
});

test.describe("roles routes", () => {
  test("GET /v1/roles returns the filtered role list", async () => {
    roleService.listRolesByQuery = async (query) => {
      assert.deepEqual(query, { active: "1" });

      return [
        {
          id: 1,
          name: "admin",
          active: 1,
          users_count: 2
        }
      ];
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles?active=1",
        buildAuthedRequest()
      );

      assert.equal(response.status, 200);
      assert.deepEqual(body, [
        {
          id: 1,
          name: "admin",
          active: 1,
          users_count: 2
        }
      ]);
    } finally {
      await server.close();
    }
  });

  test("GET /v1/roles/:id returns the requested role", async () => {
    roleService.getRoleById = async (id) => {
      assert.equal(id, "2");

      return {
        id: 2,
        name: "manager",
        active: 1,
        users_count: 4
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/2",
        buildAuthedRequest()
      );

      assert.equal(response.status, 200);
      assert.deepEqual(body, {
        id: 2,
        name: "manager",
        active: 1,
        users_count: 4
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/roles/:id returns 404 when the role does not exist", async () => {
    roleService.getRoleById = async () => {
      const error = new Error("roles.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/999",
        buildAuthedRequest()
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Role nao encontrada" });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/roles/:id returns 500 when the service fails", async () => {
    roleService.getRoleById = async () => {
      throw new Error("unexpected fetch failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/2",
        buildAuthedRequest()
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao buscar role",
        detail: "unexpected fetch failure"
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/roles validates and normalizes payload before creating", async () => {
    roleService.createRole = async (payload) => {
      assert.deepEqual(payload, {
        name: "supervisor",
        active: 1
      });

      return {
        id: 4,
        ...payload,
        users_count: 0
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles",
        buildJsonRequest(
          {
            name: "  Supervisor  "
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 201);
      assert.deepEqual(body, {
        id: 4,
        name: "supervisor",
        active: 1,
        users_count: 0
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/roles returns 500 when the service fails", async () => {
    roleService.createRole = async () => {
      throw new Error("unexpected create failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles",
        buildJsonRequest(
          {
            name: "manager"
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao criar role",
        detail: "unexpected create failure"
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/roles returns 400 when payload is invalid", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles",
        buildJsonRequest(
          {
            name: ""
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["Nome da role e obrigatorio"]
      });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/roles maps duplicate names to 400", async () => {
    roleService.createRole = async () => {
      const error = new Error("duplicate");
      error.code = "ER_DUP_ENTRY";
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles",
        buildJsonRequest(
          {
            name: "admin"
          },
          { method: "POST" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["Ja existe uma role com esse nome"]
      });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/roles/:id updates and normalizes the payload", async () => {
    roleService.updateRole = async (id, payload) => {
      assert.equal(id, "1");
      assert.deepEqual(payload, {
        name: "supervisor",
        active: 0
      });

      return {
        id: 1,
        ...payload,
        users_count: 0
      };
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/1",
        buildJsonRequest(
          {
            name: "  Supervisor  ",
            active: false
          },
          { method: "PUT" }
        )
      );

      assert.equal(response.status, 200);
      assert.deepEqual(body, {
        id: 1,
        name: "supervisor",
        active: 0,
        users_count: 0
      });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/roles/:id returns 404 when the role does not exist", async () => {
    roleService.updateRole = async () => {
      const error = new Error("roles.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/999",
        buildJsonRequest(
          {
            name: "manager",
            active: true
          },
          { method: "PUT" }
        )
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Role nao encontrada" });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/roles/:id returns 400 when the role is in use", async () => {
    roleService.updateRole = async () => {
      const error = new Error("roles.in_use");
      error.statusCode = 400;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/1",
        buildJsonRequest(
          {
            name: "admin",
            active: 0
          },
          { method: "PUT" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["Nao e possivel desativar esta role porque ela esta vinculada a usuarios"]
      });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/roles/:id maps duplicate names to 400", async () => {
    roleService.updateRole = async () => {
      const error = new Error("duplicate");
      error.code = "ER_DUP_ENTRY";
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/1",
        buildJsonRequest(
          {
            name: "admin",
            active: true
          },
          { method: "PUT" }
        )
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["Ja existe uma role com esse nome"]
      });
    } finally {
      await server.close();
    }
  });

  test("PUT /v1/roles/:id returns 500 when the service fails", async () => {
    roleService.updateRole = async () => {
      throw new Error("unexpected update failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/1",
        buildJsonRequest(
          {
            name: "manager",
            active: true
          },
          { method: "PUT" }
        )
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao atualizar role",
        detail: "unexpected update failure"
      });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/roles/:id deactivates the role", async () => {
    let receivedId = null;
    roleService.deactivateRole = async (id) => {
      receivedId = id;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/5",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(receivedId, "5");
      assert.equal(response.status, 200);
      assert.deepEqual(body, { message: "Role desativada com sucesso" });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/roles/:id returns 404 when the role does not exist", async () => {
    roleService.deactivateRole = async () => {
      const error = new Error("roles.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/999",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Role nao encontrada" });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/roles/:id returns business validation errors", async () => {
    roleService.deactivateRole = async () => {
      const error = new Error("roles.in_use");
      error.statusCode = 400;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/1",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        message: "Dados invalidos",
        errors: ["Nao e possivel desativar esta role porque ela esta vinculada a usuarios"]
      });
    } finally {
      await server.close();
    }
  });

  test("DELETE /v1/roles/:id returns 500 when the service fails", async () => {
    roleService.deactivateRole = async () => {
      throw new Error("unexpected deactivate failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/5",
        buildAuthedRequest({ method: "DELETE" })
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao desativar role",
        detail: "unexpected deactivate failure"
      });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/roles/:id/activate activates the role", async () => {
    let receivedId = null;
    roleService.activateRole = async (id) => {
      receivedId = id;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/5/activate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(receivedId, "5");
      assert.equal(response.status, 200);
      assert.deepEqual(body, { message: "Role ativada com sucesso" });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/roles/:id/activate returns 404 when the role does not exist", async () => {
    roleService.activateRole = async () => {
      const error = new Error("roles.not_found");
      error.statusCode = 404;
      throw error;
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/999/activate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(response.status, 404);
      assert.deepEqual(body, { message: "Role nao encontrada" });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/roles requires authentication", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(server, "/v1/roles");

      assert.equal(response.status, 401);
      assert.deepEqual(body, { message: "Token não informado" });
    } finally {
      await server.close();
    }
  });

  test("POST /v1/roles returns messages in English when requested", async () => {
    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles",
        buildJsonRequest(
          {
            name: ""
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
        errors: ["Role name is required"]
      });
    } finally {
      await server.close();
    }
  });

  test("GET /v1/roles returns 500 when the service fails", async () => {
    roleService.listRolesByQuery = async () => {
      throw new Error("db offline");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles",
        buildAuthedRequest()
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao listar roles",
        detail: "db offline"
      });
    } finally {
      await server.close();
    }
  });

  test("PATCH /v1/roles/:id/activate returns 500 for unexpected errors", async () => {
    roleService.activateRole = async () => {
      throw new Error("unexpected activate failure");
    };

    const server = await createTestServer(createApp);

    try {
      const { response, body } = await requestJson(
        server,
        "/v1/roles/5/activate",
        buildAuthedRequest({ method: "PATCH" })
      );

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        message: "Falha ao ativar role",
        detail: "unexpected activate failure"
      });
    } finally {
      await server.close();
    }
  });
});
