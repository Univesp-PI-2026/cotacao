const jwt = require("jsonwebtoken");
const { getRequestLocale, t } = require("../utils/i18n");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const locale = getRequestLocale(req);

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: t("auth.token_missing", locale) });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "cotacao_v02_dev_secret_change_me");
    req.auth = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: t("auth.token_invalid", locale) });
  }
}

module.exports = {
  requireAuth
};
