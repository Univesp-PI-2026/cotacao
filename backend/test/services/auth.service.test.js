const assert = require("node:assert/strict");
const test = require("node:test");
const jwt = require("jsonwebtoken");

const { createAuthService } = require("../../src/modules/auth/auth.service");
const { hashPassword } = require("../../src/utils/passwordHasher");

function createRepositoryMock() {
  return {
    findUserForLogin: async () => null
  };
}

test.describe("auth service", () => {
  test("login authenticates user and returns token payload", async () => {
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "service-test-secret";

    try {
      const passwordHash = await hashPassword("12345678");
      const repository = createRepositoryMock();
      const authService = createAuthService({ repository });

      repository.findUserForLogin = async (identifier) => {
        assert.equal(identifier, "maria@example.com");

        return {
          id: 1,
          role_id: 2,
          role_name: "admin",
          name: "Maria Silva",
          username: "maria",
          email: "maria@example.com",
          password: passwordHash,
          active: 1,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-02T00:00:00.000Z"
        };
      };

      const result = await authService.login("  Maria@Example.com  ", "12345678");
      const payload = jwt.verify(result.token, process.env.JWT_SECRET);

      assert.equal(result.user.email, "maria@example.com");
      assert.equal(result.user.username, "maria");
      assert.equal(payload.sub, "1");
      assert.equal(payload.role_name, "admin");
    } finally {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  test("login rejects when user is not found", async () => {
    const authService = createAuthService({ repository: createRepositoryMock() });

    await assert.rejects(
      authService.login("missing@example.com", "12345678"),
      (error) => {
        assert.equal(error.message, "auth.invalid_credentials");
        assert.equal(error.statusCode, 401);
        return true;
      }
    );
  });

  test("login rejects when password is invalid", async () => {
    const passwordHash = await hashPassword("12345678");
    const repository = createRepositoryMock();
    const authService = createAuthService({ repository });

    repository.findUserForLogin = async () => ({
      id: 1,
      role_id: 2,
      role_name: "admin",
      name: "Maria Silva",
      username: "maria",
      email: "maria@example.com",
      password: passwordHash,
      active: 1
    });

    await assert.rejects(
      authService.login("maria@example.com", "wrong-password"),
      (error) => {
        assert.equal(error.message, "auth.invalid_credentials");
        assert.equal(error.statusCode, 401);
        return true;
      }
    );
  });

  test("login rejects when user is inactive", async () => {
    const passwordHash = await hashPassword("12345678");
    const repository = createRepositoryMock();
    const authService = createAuthService({ repository });

    repository.findUserForLogin = async () => ({
      id: 1,
      role_id: 2,
      role_name: "admin",
      name: "Maria Silva",
      username: "maria",
      email: "maria@example.com",
      password: passwordHash,
      active: 0
    });

    await assert.rejects(
      authService.login("maria@example.com", "12345678"),
      (error) => {
        assert.equal(error.message, "auth.invalid_credentials");
        assert.equal(error.statusCode, 401);
        return true;
      }
    );
  });
});
