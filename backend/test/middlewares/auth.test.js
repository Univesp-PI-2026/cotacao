const assert = require("node:assert/strict");
const test = require("node:test");
const jwt = require("jsonwebtoken");

const { requireAuth } = require("../../src/middlewares/auth");

function createResponseDouble() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test.describe("auth middleware", () => {
  test("requireAuth rejects requests without bearer token", () => {
    const req = { headers: {} };
    const res = createResponseDouble();
    let nextCalled = false;

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, {
      message: "Token não informado"
    });
  });

  test("requireAuth rejects invalid tokens", () => {
    const req = {
      headers: {
        authorization: "Bearer invalid-token"
      }
    };
    const res = createResponseDouble();
    let nextCalled = false;

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, {
      message: "Token inválido ou expirado"
    });
  });

  test("requireAuth attaches auth payload and calls next for valid tokens", () => {
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "middleware-test-secret";

    try {
      const token = jwt.sign(
        {
          sub: "1",
          role_name: "admin",
          email: "maria@example.com"
        },
        process.env.JWT_SECRET
      );

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = createResponseDouble();
      let nextCalled = false;

      requireAuth(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(req.auth.sub, "1");
      assert.equal(req.auth.role_name, "admin");
      assert.equal(res.body, null);
    } finally {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  test("requireAuth returns localized messages when requested", () => {
    const req = {
      headers: {
        authorization: "Bearer invalid-token",
        "accept-language": "en-US"
      }
    };
    const res = createResponseDouble();

    requireAuth(req, res, () => {});

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, {
      message: "Invalid or expired token"
    });
  });
});
