const quotationRepository = require("./quotations.repository");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function listQuotations(query = {}) {
  const active =
    query.active === "0" || query.active === "1" ? Number(query.active) : undefined;
  const customerId = query.customer_id ? Number(query.customer_id) : undefined;

  return quotationRepository.findAll({
    active,
    customer_id: Number.isNaN(customerId) ? undefined : customerId
  });
}

async function countQuotations(query = {}) {
  const active =
    query.active === "0" || query.active === "1" ? Number(query.active) : undefined;
  const customerId = query.customer_id ? Number(query.customer_id) : undefined;

  return quotationRepository.count({
    active,
    customer_id: Number.isNaN(customerId) ? undefined : customerId
  });
}

async function getQuotationById(id) {
  const quotation = await quotationRepository.findById(id);

  if (!quotation) {
    throw createError("quotations.not_found", 404);
  }

  return quotation;
}

async function ensureCustomer(customerId) {
  const exists = await quotationRepository.customerExists(customerId);

  if (!exists) {
    throw createError("quotations.invalid_customer", 400);
  }
}

async function createQuotation(data) {
  await ensureCustomer(data.customer_id);

  const quotationId = await quotationRepository.create(data);
  return quotationRepository.findById(quotationId);
}

async function updateQuotation(id, data) {
  const existingQuotation = await quotationRepository.findById(id);

  if (!existingQuotation) {
    throw createError("quotations.not_found", 404);
  }

  await ensureCustomer(data.customer_id);
  await quotationRepository.update(id, data);
  return quotationRepository.findById(id);
}

async function activateQuotation(id) {
  const affectedRows = await quotationRepository.updateActiveStatus(id, 1);

  if (affectedRows === 0) {
    throw createError("quotations.not_found", 404);
  }
}

async function deactivateQuotation(id) {
  const affectedRows = await quotationRepository.updateActiveStatus(id, 0);

  if (affectedRows === 0) {
    throw createError("quotations.not_found", 404);
  }
}

module.exports = {
  activateQuotation,
  countQuotations,
  createQuotation,
  deactivateQuotation,
  getQuotationById,
  listQuotations,
  updateQuotation
};
