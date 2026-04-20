const assert = require("node:assert/strict");
const test = require("node:test");

const { createQuotationsService } = require("../../src/modules/quotations/quotations.service");

function createRepositoryMock() {
  return {
    count: async () => 0,
    create: async () => 0,
    customerExists: async () => false,
    findAll: async () => [],
    findById: async () => null,
    update: async () => {},
    updateActiveStatus: async () => 0
  };
}

test.describe("quotations service", () => {
  test("listQuotations normalizes filters", async () => {
    const repository = createRepositoryMock();
    const quotationService = createQuotationsService(repository);

    repository.findAll = async (filters) => {
      assert.deepEqual(filters, {
        active: 1,
        customer_id: 5
      });
      return [];
    };

    await quotationService.listQuotations({ active: "1", customer_id: "5" });
  });

  test("countQuotations ignores invalid customer filter", async () => {
    const repository = createRepositoryMock();
    const quotationService = createQuotationsService(repository);

    repository.count = async (filters) => {
      assert.deepEqual(filters, {
        active: 0,
        customer_id: undefined
      });
      return 2;
    };

    const total = await quotationService.countQuotations({ active: "0", customer_id: "abc" });
    assert.equal(total, 2);
  });

  test("getQuotationById throws 404 when quotation does not exist", async () => {
    const repository = createRepositoryMock();
    const quotationService = createQuotationsService(repository);

    repository.findById = async () => null;

    await assert.rejects(quotationService.getQuotationById(1), (error) => {
      assert.equal(error.message, "quotations.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });

  test("createQuotation rejects invalid customer", async () => {
    const repository = createRepositoryMock();
    const quotationService = createQuotationsService(repository);

    repository.customerExists = async () => false;

    await assert.rejects(
      quotationService.createQuotation({ customer_id: 999 }),
      (error) => {
        assert.equal(error.message, "quotations.invalid_customer");
        assert.equal(error.statusCode, 400);
        return true;
      }
    );
  });

  test("createQuotation persists and reloads quotation", async () => {
    const repository = createRepositoryMock();
    const quotationService = createQuotationsService(repository);

    repository.customerExists = async () => true;
    repository.create = async () => 11;
    repository.findById = async (id) => ({ id, customer_id: 10 });

    const result = await quotationService.createQuotation({ customer_id: 10 });
    assert.deepEqual(result, { id: 11, customer_id: 10 });
  });

  test("updateQuotation rejects missing quotation", async () => {
    const repository = createRepositoryMock();
    const quotationService = createQuotationsService(repository);

    repository.findById = async () => null;

    await assert.rejects(
      quotationService.updateQuotation(11, { customer_id: 10 }),
      (error) => {
        assert.equal(error.message, "quotations.not_found");
        assert.equal(error.statusCode, 404);
        return true;
      }
    );
  });

  test("updateQuotation rejects invalid customer", async () => {
    const repository = createRepositoryMock();
    const quotationService = createQuotationsService(repository);

    repository.findById = async () => ({ id: 11, customer_id: 10 });
    repository.customerExists = async () => false;

    await assert.rejects(
      quotationService.updateQuotation(11, { customer_id: 999 }),
      (error) => {
        assert.equal(error.message, "quotations.invalid_customer");
        assert.equal(error.statusCode, 400);
        return true;
      }
    );
  });

  test("activateQuotation throws 404 when update affects no rows", async () => {
    const repository = createRepositoryMock();
    const quotationService = createQuotationsService(repository);

    repository.updateActiveStatus = async () => 0;

    await assert.rejects(quotationService.activateQuotation(11), (error) => {
      assert.equal(error.message, "quotations.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });

  test("deactivateQuotation throws 404 when update affects no rows", async () => {
    const repository = createRepositoryMock();
    const quotationService = createQuotationsService(repository);

    repository.updateActiveStatus = async () => 0;

    await assert.rejects(quotationService.deactivateQuotation(11), (error) => {
      assert.equal(error.message, "quotations.not_found");
      assert.equal(error.statusCode, 404);
      return true;
    });
  });
});
