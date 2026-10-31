const assert = require("node:assert/strict");
const test = require("node:test");
const { duplicateEntryMessage } = require("../../src/utils/duplicate-entry");

test("identifies both qualified and unqualified MySQL index names", () => {
  for (const index of ["uq_customers_email", "customers.uq_customers_email", "quotation.customers.uq_customers_email"]) {
    assert.equal(duplicateEntryMessage({ sqlMessage: `Duplicate entry 'privado' for key '${index}'` },
      "pt-BR", "customers.duplicate_unique_fields"), "Este e-mail já está cadastrado para outro cliente.");
  }
});

test("supports English and the driver's message fallback", () => {
  assert.equal(duplicateEntryMessage({ message: "Duplicate entry 'private' for key 'uq_customers_cpf'" },
    "en", "customers.duplicate_unique_fields"), "This CPF is already registered to another customer.");
});

test("does not mistake index names inside the private value for the violated constraint", () => {
  assert.equal(duplicateEntryMessage({ sqlMessage:
    "Duplicate entry 'for key 'uq_customers_email'' for key 'uq_customers_rnm'" },
    "pt-BR", "customers.duplicate_unique_fields"), "Este RNM já está cadastrado para outro cliente.");
});

test("uses a safe generic message for unknown or missing index names", () => {
  for (const sqlMessage of ["Duplicate entry 'private' for key 'PRIMARY'", "private", undefined]) {
    const message = duplicateEntryMessage({ sqlMessage }, "pt-BR", "customers.duplicate_unique_fields");
    assert.equal(message, "Já existe um cliente com esses dados. Verifique o e-mail, CPF e RNM.");
    assert.equal(message.includes("private"), false);
  }
});
