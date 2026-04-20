const assert = require("node:assert/strict");
const test = require("node:test");

const { createUsersService } = require("../../src/modules/users/users.service");
const { verifyPassword } = require("../../src/utils/passwordHasher");

function createRepositoryMock() {
  return {
    count: async () => 0,
    countActiveAdmins: async () => 0,
    create: async () => 0,
    findAll: async () => [],
    findById: async () => null,
    findRoleById: async () => null,
    roleExists: async () => false,
    update: async () => {},
    updateActiveStatus: async () => 0
  };
}

test.describe("users service", () => {
  test("listUsers normalizes query filters", async () => {
    const repository = createRepositoryMock();
    const userService = createUsersService({ repository });

    repository.findAll = async (filters) => {
      assert.deepEqual(filters, {
        active: 1,
        role_id: 5
      });
      return [];
    };

    await userService.listUsers({ active: "1", role_id: "5" });
  });

  test("countUsers ignores invalid role filter", async () => {
    const repository = createRepositoryMock();
    const userService = createUsersService({ repository });

    repository.count = async (filters) => {
      assert.deepEqual(filters, {
        active: 0,
        role_id: undefined
      });
      return 2;
    };

    const total = await userService.countUsers({ active: "0", role_id: "abc" });
    assert.equal(total, 2);
  });

  test("getUserById throws 404 when user does not exist", async () => {
    const repository = createRepositoryMock();
    const userService = createUsersService({ repository });

    repository.findById = async () => null;

    await assert.rejects(userService.getUserById(10), (error) => {
      assert.equal(error.message, "users.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });

  test("createUser validates role and hashes password before persisting", async () => {
    let createdPayload = null;
    const repository = createRepositoryMock();
    const userService = createUsersService({ repository });

    repository.roleExists = async (roleId) => roleId === 2;
    repository.create = async (payload) => {
      createdPayload = payload;
      return 15;
    };
    repository.findById = async (id) => ({ id, username: "maria" });

    const result = await userService.createUser({
      role_id: 2,
      name: "Maria Silva",
      username: "maria",
      email: "maria@example.com",
      password: "12345678",
      active: 1
    });

    assert.equal(result.id, 15);
    assert.notEqual(createdPayload.password, "12345678");
    assert.equal(await verifyPassword("12345678", createdPayload.password), true);
  });

  test("createUser rejects invalid role", async () => {
    const repository = createRepositoryMock();
    const userService = createUsersService({ repository });

    repository.roleExists = async () => false;

    await assert.rejects(
      userService.createUser({
        role_id: 999,
        password: "12345678"
      }),
      (error) => {
        assert.equal(error.message, "users.invalid_role");
        assert.equal(error.statusCode, 400);
        return true;
      }
    );
  });

  test("updateUser rejects missing user", async () => {
    const repository = createRepositoryMock();
    const userService = createUsersService({ repository });

    repository.findById = async () => null;

    await assert.rejects(userService.updateUser(10, { role_id: 2, active: 1 }), (error) => {
      assert.equal(error.message, "users.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });

  test("updateUser prevents deactivating the last active admin", async () => {
    const repository = createRepositoryMock();
    const userService = createUsersService({ repository });

    repository.findById = async () => ({
      id: 1,
      role_id: 1,
      role_name: "admin",
      active: 1
    });
    repository.roleExists = async () => true;
    repository.findRoleById = async () => ({ id: 2, name: "manager" });
    repository.countActiveAdmins = async () => 0;

    await assert.rejects(
      userService.updateUser(1, {
        role_id: 2,
        name: "Admin",
        username: "admin",
        email: "admin@example.com",
        active: 0
      }),
      (error) => {
        assert.equal(error.message, "users.last_active_admin_required");
        assert.equal(error.statusCode, 400);
        return true;
      }
    );
  });

  test("updateUser hashes password when provided", async () => {
    let updatedPayload = null;
    const repository = createRepositoryMock();
    const userService = createUsersService({ repository });

    repository.findById = async () => ({
      id: 10,
      role_id: 2,
      role_name: "manager",
      active: 1
    });
    repository.roleExists = async () => true;
    repository.update = async (_id, payload) => {
      updatedPayload = payload;
    };
    repository.findById = async (id) => ({
      id,
      role_id: 2,
      role_name: "manager"
    });

    await userService.updateUser(10, {
      role_id: 2,
      name: "Maria",
      username: "maria",
      email: "maria@example.com",
      password: "12345678",
      active: 1
    });

    assert.equal(await verifyPassword("12345678", updatedPayload.password), true);
  });

  test("activateUser throws 404 when update affects no rows", async () => {
    const repository = createRepositoryMock();
    const userService = createUsersService({ repository });

    repository.updateActiveStatus = async () => 0;

    await assert.rejects(userService.activateUser(10), (error) => {
      assert.equal(error.message, "users.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });

  test("deactivateUser throws 404 when user does not exist", async () => {
    const repository = createRepositoryMock();
    const userService = createUsersService({ repository });

    repository.findById = async () => null;

    await assert.rejects(userService.deactivateUser(10), (error) => {
      assert.equal(error.message, "users.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });
});
