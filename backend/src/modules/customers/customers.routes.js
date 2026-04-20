const express = require("express");

const customerService = require("./customers.service");
const { validateCustomerPayload } = require("./customers.validator");
const { badRequest, notFound, serverError } = require("../../utils/http");
const { getRequestLocale, t } = require("../../utils/i18n");

const router = express.Router();

router.get("/count", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    const total = await customerService.countCustomers(req.query);
    return res.json({ total });
  } catch (error) {
    return serverError(res, error, "customers.list_failed", locale);
  }
});

router.get("/", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    const customers = await customerService.listCustomers(req.query);
    return res.json({
      data: customers,
      total: customers.length
    });
  } catch (error) {
    return serverError(res, error, "customers.list_failed", locale);
  }
});

router.get("/:id", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    return res.json(customer);
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    return serverError(res, error, "customers.fetch_failed", locale);
  }
});

router.post("/", async (req, res) => {
  const locale = getRequestLocale(req);
  const validation = validateCustomerPayload(req.body, locale);

  if (validation.errors) {
    return badRequest(res, validation.errors, locale);
  }

  try {
    const customer = await customerService.createCustomer(validation.data);
    return res.status(201).json(customer);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return badRequest(res, [t("customers.duplicate_unique_fields", locale)], locale);
    }

    return serverError(res, error, "customers.create_failed", locale);
  }
});

router.put("/:id", async (req, res) => {
  const locale = getRequestLocale(req);
  const validation = validateCustomerPayload(req.body, locale);

  if (validation.errors) {
    return badRequest(res, validation.errors, locale);
  }

  try {
    const customer = await customerService.updateCustomer(req.params.id, validation.data);
    return res.json(customer);
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    if (error.code === "ER_DUP_ENTRY") {
      return badRequest(res, [t("customers.duplicate_unique_fields", locale)], locale);
    }

    return serverError(res, error, "customers.update_failed", locale);
  }
});

router.delete("/:id", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    await customerService.deactivateCustomer(req.params.id);
    return res.json({ message: t("customers.deactivated_success", locale) });
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    return serverError(res, error, "customers.deactivate_failed", locale);
  }
});

router.patch("/:id/activate", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    await customerService.activateCustomer(req.params.id);
    return res.json({ message: t("customers.activated_success", locale) });
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    return serverError(res, error, "customers.activate_failed", locale);
  }
});

router.patch("/:id/deactivate", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    await customerService.deactivateCustomer(req.params.id);
    return res.json({ message: t("customers.deactivated_success", locale) });
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    return serverError(res, error, "customers.deactivate_failed", locale);
  }
});

module.exports = router;
