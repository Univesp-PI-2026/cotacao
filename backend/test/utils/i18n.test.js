const assert = require("node:assert/strict");
const test = require("node:test");

const { getRequestLocale, t } = require("../../src/utils/i18n");

test.describe("i18n utils", () => {
  test("getRequestLocale prioritizes Accept-Language when present", () => {
    const locale = getRequestLocale({
      headers: {
        "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8"
      }
    });

    assert.equal(locale, "en");
  });

  test("getRequestLocale falls back to DEFAULT_LOCALE", () => {
    const originalDefaultLocale = process.env.DEFAULT_LOCALE;
    process.env.DEFAULT_LOCALE = "en-US";

    try {
      const locale = getRequestLocale({ headers: {} });
      assert.equal(locale, "en");
    } finally {
      process.env.DEFAULT_LOCALE = originalDefaultLocale;
    }
  });

  test("getRequestLocale falls back to pt-BR when locale is unsupported", () => {
    const originalDefaultLocale = process.env.DEFAULT_LOCALE;
    process.env.DEFAULT_LOCALE = "es-ES";

    try {
      const locale = getRequestLocale({
        headers: {
          "accept-language": "es-ES"
        }
      });

      assert.equal(locale, "pt-BR");
    } finally {
      process.env.DEFAULT_LOCALE = originalDefaultLocale;
    }
  });

  test("t returns translated message for the requested locale", () => {
    assert.equal(t("auth.validation.password_required", "en-US"), "Enter your password");
    assert.equal(t("auth.validation.password_required", "pt-BR"), "Informe a senha");
  });

  test("t falls back to pt-BR when key is missing in selected locale", () => {
    assert.equal(t("common.invalid_data", "en-US"), "Invalid data");
    assert.equal(t("users.not_found", "en-US"), "User not found");
  });

  test("t returns the key itself when translation does not exist", () => {
    assert.equal(t("missing.translation.key", "en-US"), "missing.translation.key");
  });
});
