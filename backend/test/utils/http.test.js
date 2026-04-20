const assert = require("node:assert/strict");
const test = require("node:test");

const { badRequest, notFound, serverError } = require("../../src/utils/http");

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

test.describe("http utils", () => {
  test("badRequest returns localized 400 response", () => {
    const res = createResponseDouble();

    badRequest(res, ["field is required"], "en-US");

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      message: "Invalid data",
      errors: ["field is required"]
    });
  });

  test("notFound returns localized 404 response", () => {
    const res = createResponseDouble();

    notFound(res, "users.not_found", "en-US");

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
      message: "User not found"
    });
  });

  test("serverError returns localized 500 response with details", () => {
    const res = createResponseDouble();

    serverError(res, new Error("db offline"), "customers.list_failed", "en-US");

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
      message: "Failed to list customers",
      detail: "db offline"
    });
  });
});
