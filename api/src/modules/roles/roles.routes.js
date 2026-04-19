const express = require("express");

const { badRequest, notFound, serverError } = require("../../utils/http");
const { getRequestLocale, t } = require("../../utils/i18n");
const roleService = require("./roles.service");
const { validateRolePayload } = require("./roles.validator");

const router = express.Router();

router.get("/", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    const roles = await roleService.listRolesByQuery(req.query);
    return res.json(roles);
  } catch (error) {
    return serverError(res, error, "roles.list_failed", locale);
  }
});

router.get("/:id", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    const role = await roleService.getRoleById(req.params.id);
    return res.json(role);
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    return serverError(res, error, "roles.fetch_failed", locale);
  }
});

router.post("/", async (req, res) => {
  const locale = getRequestLocale(req);
  const validation = validateRolePayload(req.body, locale);

  if (validation.errors) {
    return badRequest(res, validation.errors, locale);
  }

  try {
    const role = await roleService.createRole(validation.data);
    return res.status(201).json(role);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return badRequest(res, [t("roles.duplicate_name", locale)], locale);
    }

    return serverError(res, error, "roles.create_failed", locale);
  }
});

router.put("/:id", async (req, res) => {
  const locale = getRequestLocale(req);
  const validation = validateRolePayload(req.body, locale);

  if (validation.errors) {
    return badRequest(res, validation.errors, locale);
  }

  try {
    const role = await roleService.updateRole(req.params.id, validation.data);
    return res.json(role);
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    if (error.code === "ER_DUP_ENTRY") {
      return badRequest(res, [t("roles.duplicate_name", locale)], locale);
    }

    return serverError(res, error, "roles.update_failed", locale);
  }
});

router.delete("/:id", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    await roleService.deactivateRole(req.params.id);
    return res.json({ message: t("roles.deactivated_success", locale) });
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    if (error.statusCode === 400) {
      return badRequest(res, [t(error.message, locale)], locale);
    }

    return serverError(res, error, "roles.deactivate_failed", locale);
  }
});

router.patch("/:id/activate", async (req, res) => {
  const locale = getRequestLocale(req);
  try {
    await roleService.activateRole(req.params.id);
    return res.json({ message: t("roles.activated_success", locale) });
  } catch (error) {
    if (error.statusCode === 404) {
      return notFound(res, error.message, locale);
    }

    return serverError(res, error, "roles.activate_failed", locale);
  }
});

module.exports = router;
