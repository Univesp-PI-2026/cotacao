const customerRepository = require("./customers.repository");

function createNotFoundError(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

async function listCustomers(query = {}) {
  const active =
    query.active === "0" || query.active === "1" ? Number(query.active) : undefined;

  return customerRepository.findAll({ active });
}

async function countCustomers(query = {}) {
  const active =
    query.active === "0" || query.active === "1" ? Number(query.active) : undefined;

  return customerRepository.count({ active });
}

async function getCustomerById(id) {
  const customer = await customerRepository.findById(id);

  if (!customer) {
    throw createNotFoundError("customers.not_found");
  }

  return customer;
}

async function createCustomer(data) {
  const customerId = await customerRepository.create(data);
  return customerRepository.findById(customerId);
}

async function updateCustomer(id, data) {
  const existingCustomer = await customerRepository.findById(id);

  if (!existingCustomer) {
    throw createNotFoundError("customers.not_found");
  }

  await customerRepository.update(id, data);
  return customerRepository.findById(id);
}

async function activateCustomer(id) {
  const affectedRows = await customerRepository.updateActiveStatus(id, 1);

  if (affectedRows === 0) {
    throw createNotFoundError("customers.not_found");
  }
}

async function deactivateCustomer(id) {
  const affectedRows = await customerRepository.updateActiveStatus(id, 0);

  if (affectedRows === 0) {
    throw createNotFoundError("customers.not_found");
  }
}

module.exports = {
  activateCustomer,
  countCustomers,
  createCustomer,
  deactivateCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer
};
