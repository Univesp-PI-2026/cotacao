const assert = require("node:assert/strict");
const test = require("node:test");

const { createRolesService } = require("../../src/modules/roles/roles.service");

function createRepositoryMock() {
  return {
    countUsersByRoleId: async () => 0,
    create: async () => 0,
    findAll: async () => [],
    findById: async () => null,
    update: async () => {},
    updateActiveStatus: async () => 0
  };
}

test.describe("roles service", () => {
  test("listRolesByQuery normalizes active filter", async () => {
    const repository = createRepositoryMock();
    const roleService = createRolesService(repository);

    repository.findAll = async (filters) => {
      assert.deepEqual(filters, { active: 1 });
      return [];
    };

    await roleService.listRolesByQuery({ active: "1" });
  });

  test("getRoleById throws 404 when role does not exist", async () => {
    const repository = createRepositoryMock();
    const roleService = createRolesService(repository);

    repository.findById = async () => null;

    await assert.rejects(roleService.getRoleById(1), (error) => {
      assert.equal(error.message, "roles.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });

  test("createRole persists and reloads role", async () => {
    const repository = createRepositoryMock();
    const roleService = createRolesService(repository);

    repository.create = async () => 3;
    repository.findById = async (id) => ({ id, name: "manager" });

    const result = await roleService.createRole({ name: "manager", active: 1 });
    assert.deepEqual(result, { id: 3, name: "manager" });
  });

  test("updateRole rejects missing role", async () => {
    const repository = createRepositoryMock();
    const roleService = createRolesService(repository);

    repository.findById = async () => null;

    await assert.rejects(roleService.updateRole(1, { active: 1 }), (error) => {
      assert.equal(error.message, "roles.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });

  test("updateRole rejects deactivation when role is in use", async () => {
    const repository = createRepositoryMock();
    const roleService = createRolesService(repository);

    repository.findById = async () => ({ id: 1, active: 1 });
    repository.countUsersByRoleId = async () => 2;

    await assert.rejects(roleService.updateRole(1, { active: 0 }), (error) => {
      assert.equal(error.message, "roles.in_use");
      assert.equal(error.statusCode, 400);
      return true;
    });
  });

  test("deactivateRole rejects when role is in use", async () => {
    const repository = createRepositoryMock();
    const roleService = createRolesService(repository);

    repository.findById = async () => ({ id: 1, active: 1 });
    repository.countUsersByRoleId = async () => 1;

    await assert.rejects(roleService.deactivateRole(1), (error) => {
      assert.equal(error.message, "roles.in_use");
      assert.equal(error.statusCode, 400);
      return true;
    });
  });

  test("activateRole throws 404 when update affects no rows", async () => {
    const repository = createRepositoryMock();
    const roleService = createRolesService(repository);

    repository.updateActiveStatus = async () => 0;

    await assert.rejects(roleService.activateRole(1), (error) => {
      assert.equal(error.message, "roles.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });
});
