const customerRepository = require("./customers.repository");

function createNotFoundError(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

function createCustomersService(repository = customerRepository) {
  async function listCustomers(query = {}) {
    const active =
      query.active === "0" || query.active === "1" ? Number(query.active) : undefined;

    return repository.findAll({ active });
  }

  async function countCustomers(query = {}) {
    const active =
      query.active === "0" || query.active === "1" ? Number(query.active) : undefined;

    return repository.count({ active });
  }

  async function getCustomerById(id) {
    const customer = await repository.findById(id);

    if (!customer) {
      throw createNotFoundError("customers.not_found");
    }

    return customer;
  }

  async function createCustomer(data) {
    const customerId = await repository.create(data);
    return repository.findById(customerId);
  }

  async function updateCustomer(id, data) {
    const existingCustomer = await repository.findById(id);

    if (!existingCustomer) {
      throw createNotFoundError("customers.not_found");
    }

    await repository.update(id, data);
    return repository.findById(id);
  }

  async function activateCustomer(id) {
    const affectedRows = await repository.updateActiveStatus(id, 1);

    if (affectedRows === 0) {
      throw createNotFoundError("customers.not_found");
    }
  }

  async function deactivateCustomer(id) {
    const affectedRows = await repository.updateActiveStatus(id, 0);

    if (affectedRows === 0) {
      throw createNotFoundError("customers.not_found");
    }
  }

  return {
    activateCustomer,
    countCustomers,
    createCustomer,
    deactivateCustomer,
    getCustomerById,
    listCustomers,
    updateCustomer
  };
}

module.exports = {
  ...createCustomersService(),
  createCustomersService
};
