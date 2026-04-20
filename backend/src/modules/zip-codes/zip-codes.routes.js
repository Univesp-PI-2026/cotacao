const express = require("express");

const { getRequestLocale, t } = require("../../utils/i18n");
const zipCodeService = require("./zip-codes.service");

const router = express.Router();

router.get("/:zipCode", async (req, res) => {
  const locale = getRequestLocale(req);

  try {
    const zipCode = await zipCodeService.lookupZipCode(req.params.zipCode);
    return res.json(zipCode);
  } catch (error) {
    if (error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 502) {
      return res.status(error.statusCode).json({ message: t(error.message, locale) });
    }

    return res.status(500).json({ message: t("zip_codes.lookup_failed", locale) });
  }
});

module.exports = router;
