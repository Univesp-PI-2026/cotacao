const express = require("express");

const { badRequest, notFound, serverError } = require("../../utils/http");
const { getRequestLocale, t } = require("../../utils/i18n");
const quotationService = require("./quotations.service");
const { validateQuotationPayload } = require("./quotations.validator");

const router = express.Router();

router.get("/count", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    const total = await quotationService.countQuotations(req.query);
    return res.json({ total });
  } catch (error) {
    return serverError(res, error, "quotations.list_failed", locale);
  }
});

router.get("/", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    const quotations = await quotationService.listQuotations(req.query);
    return res.json({
      data: quotations,
      total: quotations.length
    });
  } catch (error) {
    return serverError(res, error, "quotations.list_failed", locale);
  }
});

router.get("/:id", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    const quotation = await quotationService.getQuotationById(req.params.id);
    return res.json(quotation);
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    return serverError(res, error, "quotations.fetch_failed", locale);
  }
});

router.post("/", async (req, res) => {
  const locale = getRequestLocale(req);
  const validation = validateQuotationPayload(req.body, locale);

  if (validation.errors) {
    return badRequest(res, validation.errors, locale);
  }

  try {
    const quotation = await quotationService.createQuotation(validation.data);
    return res.status(201).json(quotation);
  } catch (error) {
    if (error.statusCode === 400) {
      return badRequest(res, [t(error.message, locale)], locale);
    }

    return serverError(res, error, "quotations.create_failed", locale);
  }
});

router.put("/:id", async (req, res) => {
  const locale = getRequestLocale(req);
  const validation = validateQuotationPayload(req.body, locale);

  if (validation.errors) {
    return badRequest(res, validation.errors, locale);
  }

  try {
    const quotation = await quotationService.updateQuotation(req.params.id, validation.data);
    return res.json(quotation);
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    if (error.statusCode === 400) {
      return badRequest(res, [t(error.message, locale)], locale);
    }

    return serverError(res, error, "quotations.update_failed", locale);
  }
});

router.delete("/:id", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    await quotationService.deactivateQuotation(req.params.id);
    return res.json({ message: t("quotations.deactivated_success", locale) });
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    return serverError(res, error, "quotations.deactivate_failed", locale);
  }
});

router.patch("/:id/activate", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    await quotationService.activateQuotation(req.params.id);
    return res.json({ message: t("quotations.activated_success", locale) });
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    return serverError(res, error, "quotations.activate_failed", locale);
  }
});

module.exports = router;
