const express = require("express");

const { badRequest, notFound, serverError } = require("../../utils/http");
const { getRequestLocale, t } = require("../../utils/i18n");
const userService = require("./users.service");
const { validateUserPayload } = require("./users.validator");

const router = express.Router();

router.get("/count", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    const total = await userService.countUsers(req.query);
    return res.json({ total });
  } catch (error) {
    return serverError(res, error, "users.list_failed", locale);
  }
});

router.get("/", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    const users = await userService.listUsers(req.query);
    return res.json({
      data: users,
      total: users.length
    });
  } catch (error) {
    return serverError(res, error, "users.list_failed", locale);
  }
});

router.get("/:id", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    const user = await userService.getUserById(req.params.id);
    return res.json(user);
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    return serverError(res, error, "users.fetch_failed", locale);
  }
});

router.post("/", async (req, res) => {
  const locale = getRequestLocale(req);
  const validation = validateUserPayload(req.body, { requiresPassword: true }, locale);

  if (validation.errors) {
    return badRequest(res, validation.errors, locale);
  }

  try {
    const user = await userService.createUser(validation.data);
    return res.status(201).json(user);
  } catch (error) {
    if (error.statusCode === 400) {
      return badRequest(res, [t(error.message, locale)], locale);
    }

    if (error.code === "ER_DUP_ENTRY") {
      return badRequest(res, [t("users.duplicate_user_identity", locale)], locale);
    }

    return serverError(res, error, "users.create_failed", locale);
  }
});

router.put("/:id", async (req, res) => {
  const locale = getRequestLocale(req);
  const validation = validateUserPayload(req.body, { requiresPassword: false }, locale);

  if (validation.errors) {
    return badRequest(res, validation.errors, locale);
  }

  try {
    const user = await userService.updateUser(req.params.id, validation.data);
    return res.json(user);
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    if (error.statusCode === 400) {
      return badRequest(res, [t(error.message, locale)], locale);
    }

    if (error.code === "ER_DUP_ENTRY") {
      return badRequest(res, [t("users.duplicate_user_identity", locale)], locale);
    }

    return serverError(res, error, "users.update_failed", locale);
  }
});

router.delete("/:id", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    await userService.deactivateUser(req.params.id);
    return res.json({ message: t("users.deactivated_success", locale) });
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    if (error.statusCode === 400) {
      return badRequest(res, [t(error.message, locale)], locale);
    }

    return serverError(res, error, "users.deactivate_failed", locale);
  }
});

router.patch("/:id/activate", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    await userService.activateUser(req.params.id);
    return res.json({ message: t("users.activated_success", locale) });
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    return serverError(res, error, "users.activate_failed", locale);
  }
});

module.exports = router;
