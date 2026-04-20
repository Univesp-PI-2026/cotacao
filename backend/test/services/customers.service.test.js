const assert = require("node:assert/strict");
const test = require("node:test");

const { createCustomersService } = require("../../src/modules/customers/customers.service");

function createRepositoryMock() {
  return {
    count: async () => 0,
    create: async () => 0,
    findAll: async () => [],
    findById: async () => null,
    update: async () => {},
    updateActiveStatus: async () => 0
  };
}

test.describe("customers service", () => {
  test("listCustomers normalizes active filter", async () => {
    const repository = createRepositoryMock();
    const customerService = createCustomersService(repository);

    repository.findAll = async (filters) => {
      assert.deepEqual(filters, { active: 1 });
      return [];
    };

    await customerService.listCustomers({ active: "1" });
  });

  test("countCustomers normalizes active filter", async () => {
    const repository = createRepositoryMock();
    const customerService = createCustomersService(repository);

    repository.count = async (filters) => {
      assert.deepEqual(filters, { active: 0 });
      return 4;
    };

    const total = await customerService.countCustomers({ active: "0" });
    assert.equal(total, 4);
  });

  test("getCustomerById throws 404 when customer does not exist", async () => {
    const repository = createRepositoryMock();
    const customerService = createCustomersService(repository);

    repository.findById = async () => null;

    await assert.rejects(customerService.getCustomerById(1), (error) => {
      assert.equal(error.message, "customers.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });

  test("createCustomer persists and reloads customer", async () => {
    const repository = createRepositoryMock();
    const customerService = createCustomersService(repository);

    repository.create = async () => 10;
    repository.findById = async (id) => ({ id, name: "Maria Silva" });

    const result = await customerService.createCustomer({ name: "Maria Silva" });
    assert.deepEqual(result, { id: 10, name: "Maria Silva" });
  });

  test("updateCustomer rejects missing customer", async () => {
    const repository = createRepositoryMock();
    const customerService = createCustomersService(repository);

    repository.findById = async () => null;

    await assert.rejects(customerService.updateCustomer(10, { name: "Maria" }), (error) => {
      assert.equal(error.message, "customers.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });

  test("activateCustomer throws 404 when update affects no rows", async () => {
    const repository = createRepositoryMock();
    const customerService = createCustomersService(repository);

    repository.updateActiveStatus = async () => 0;

    await assert.rejects(customerService.activateCustomer(10), (error) => {
      assert.equal(error.message, "customers.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });

  test("deactivateCustomer throws 404 when update affects no rows", async () => {
    const repository = createRepositoryMock();
    const customerService = createCustomersService(repository);

    repository.updateActiveStatus = async () => 0;

    await assert.rejects(customerService.deactivateCustomer(10), (error) => {
      assert.equal(error.message, "customers.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });
});
