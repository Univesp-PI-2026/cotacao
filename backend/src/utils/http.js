const { t } = require("./i18n");

function badRequest(res, errors, locale, messageKey = "common.invalid_data") {
  return res.status(400).json({
    message: t(messageKey, locale),
    errors
  });
}

function notFound(res, messageOrKey = "common.not_found", locale) {
  return res.status(404).json({ message: t(messageOrKey, locale) });
}

function serverError(res, error, messageOrKey = "common.internal_server_error", locale) {
  return res.status(500).json({
    message: t(messageOrKey, locale),
    detail: error.message
  });
}

module.exports = {
  badRequest,
  notFound,
  serverError
};
