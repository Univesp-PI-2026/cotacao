const argon2 = require("argon2");
const bcrypt = require("bcryptjs");

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1
};

function isArgon2Hash(hash) {
  return typeof hash === "string" && hash.startsWith("$argon2");
}

function isBcryptHash(hash) {
  return typeof hash === "string" && /^\$2[aby]\$/.test(hash);
}

async function hashPassword(password) {
  return argon2.hash(password, ARGON2_OPTIONS);
}

async function verifyPassword(password, hash) {
  if (isArgon2Hash(hash)) {
    return argon2.verify(hash, password);
  }

  if (isBcryptHash(hash)) {
    return bcrypt.compare(password, hash);
  }

  return false;
}

function needsRehash(hash) {
  return !isArgon2Hash(hash);
}

module.exports = {
  hashPassword,
  verifyPassword,
  needsRehash
};
