const express = require("express");

const authService = require("./auth.service");
const { validateLoginPayload } = require("./auth.validator");
const { badRequest, serverError } = require("../../utils/http");
const { getRequestLocale, t } = require("../../utils/i18n");

const router = express.Router();

router.post("/login", async (req, res) => {
  const locale = getRequestLocale(req);
  const validation = validateLoginPayload(req.body, locale);

  if (validation.errors) {
    return badRequest(res, validation.errors, locale);
  }

  try {
    const result = await authService.login(validation.data.identifier, validation.data.password);
    return res.json(result);
  } catch (error) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return res.status(error.statusCode).json({ message: t(error.message, locale) });
    }

    return serverError(res, error, "auth.login_failed", locale);
  }
});

module.exports = router;
