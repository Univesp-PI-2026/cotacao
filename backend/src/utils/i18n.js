const ptBR = require("../locales/pt-BR");
const en = require("../locales/en");

const catalogs = {
  "pt-BR": ptBR,
  en
};

function getNestedValue(object, path) {
  return path.split(".").reduce((current, part) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return current[part];
  }, object);
}

function normalizeLocale(locale) {
  if (!locale) {
    return null;
  }

  const normalized = String(locale).trim();

  if (normalized.toLowerCase().startsWith("pt")) {
    return "pt-BR";
  }

  if (normalized.toLowerCase().startsWith("en")) {
    return "en";
  }

  return null;
}

function getRequestLocale(req) {
  const header = req && req.headers ? req.headers["accept-language"] : null;
  const firstLocale = header ? String(header).split(",")[0] : null;
  return normalizeLocale(firstLocale) || normalizeLocale(process.env.DEFAULT_LOCALE) || "pt-BR";
}

function t(key, locale = "pt-BR") {
  const normalizedLocale = normalizeLocale(locale) || "pt-BR";
  return (
    getNestedValue(catalogs[normalizedLocale], key) ||
    getNestedValue(catalogs["pt-BR"], key) ||
    key
  );
}

module.exports = {
  getRequestLocale,
  t
};
