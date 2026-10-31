const { t } = require("./i18n");

const messagesByIndex = {
  uq_customers_email: "customers.duplicate_email",
  uq_customers_cpf: "customers.duplicate_cpf",
  uq_customers_rnm: "customers.duplicate_rnm",
  uq_users_email: "users.duplicate_email"
};

function duplicateEntryMessage(error, locale, fallbackKey) {
  // Use somente o identificador do índice; nunca devolva valores ou SQL do erro.
  const message = error.sqlMessage || error.message || "";
  const match = message.match(/\bfor key ['"`](?:[^'"`]*\.)?(uq_[a-z0-9_]+)['"`]\s*$/i);
  const key = match && Object.hasOwn(messagesByIndex, match[1])
    ? messagesByIndex[match[1]]
    : fallbackKey;
  return t(key, locale);
}

module.exports = { duplicateEntryMessage };
