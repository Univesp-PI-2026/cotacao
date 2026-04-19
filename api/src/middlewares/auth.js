const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token nao informado" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "cotacao_v02_dev_secret_change_me");
    req.auth = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Token invalido ou expirado" });
  }
}

module.exports = {
  requireAuth
};
