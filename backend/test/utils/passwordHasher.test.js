const assert = require("node:assert/strict");
const test = require("node:test");

const { hashPassword, needsRehash, verifyPassword } = require("../../src/utils/passwordHasher");

test.describe("passwordHasher utils", () => {
  test("hashPassword generates an argon2 hash", async () => {
    const hash = await hashPassword("12345678");

    assert.equal(typeof hash, "string");
    assert.equal(hash.startsWith("$argon2"), true);
  });

  test("verifyPassword validates argon2 hashes", async () => {
    const hash = await hashPassword("12345678");

    assert.equal(await verifyPassword("12345678", hash), true);
    assert.equal(await verifyPassword("wrong-password", hash), false);
  });

  test("verifyPassword returns false for unsupported hash formats", async () => {
    assert.equal(await verifyPassword("12345678", "plain-text-hash"), false);
    assert.equal(await verifyPassword("12345678", "$2b$10$legacybcryptformat"), false);
  });

  test("needsRehash is false for argon2 and true otherwise", async () => {
    const argonHash = await hashPassword("12345678");

    assert.equal(needsRehash(argonHash), false);
    assert.equal(needsRehash("$2b$10$legacybcryptformat"), true);
    assert.equal(needsRehash("plain-text-hash"), true);
  });
});
