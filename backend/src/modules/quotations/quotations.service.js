const quotationRepository = require("./quotations.repository");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createQuotationsService(repository = quotationRepository) {
  async function listQuotations(query = {}) {
    const active =
      query.active === "0" || query.active === "1" ? Number(query.active) : undefined;
    const customerId = query.customer_id ? Number(query.customer_id) : undefined;

    return repository.findAll({
      active,
      customer_id: Number.isNaN(customerId) ? undefined : customerId
    });
  }

  async function countQuotations(query = {}) {
    const active =
      query.active === "0" || query.active === "1" ? Number(query.active) : undefined;
    const customerId = query.customer_id ? Number(query.customer_id) : undefined;

    return repository.count({
      active,
      customer_id: Number.isNaN(customerId) ? undefined : customerId
    });
  }

  async function getQuotationById(id) {
    const quotation = await repository.findById(id);

    if (!quotation) {
      throw createError("quotations.not_found", 404);
    }

    return quotation;
  }

  async function ensureCustomer(customerId) {
    const exists = await repository.customerExists(customerId);

    if (!exists) {
      throw createError("quotations.invalid_customer", 400);
    }
  }

  async function createQuotation(data) {
    await ensureCustomer(data.customer_id);

    const quotationId = await repository.create(data);
    return repository.findById(quotationId);
  }

  async function updateQuotation(id, data) {
    const existingQuotation = await repository.findById(id);

    if (!existingQuotation) {
      throw createError("quotations.not_found", 404);
    }

    await ensureCustomer(data.customer_id);
    await repository.update(id, data);
    return repository.findById(id);
  }

  async function activateQuotation(id) {
    const affectedRows = await repository.updateActiveStatus(id, 1);

    if (affectedRows === 0) {
      throw createError("quotations.not_found", 404);
    }
  }

  async function deactivateQuotation(id) {
    const affectedRows = await repository.updateActiveStatus(id, 0);

    if (affectedRows === 0) {
      throw createError("quotations.not_found", 404);
    }
  }

  return {
    activateQuotation,
    countQuotations,
    createQuotation,
    deactivateQuotation,
    getQuotationById,
    listQuotations,
    updateQuotation
  };
}

module.exports = {
  ...createQuotationsService(),
  createQuotationsService
};
