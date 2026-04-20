function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeZipCode(zipCode) {
  return String(zipCode || "").replace(/\D/g, "");
}

async function lookupZipCode(zipCode) {
  const normalizedZipCode = normalizeZipCode(zipCode);

  if (!/^\d{8}$/.test(normalizedZipCode)) {
    throw createError("zip_codes.invalid_format", 400);
  }

  let response;

  try {
    response = await fetch(`https://viacep.com.br/ws/${normalizedZipCode}/json/`);
  } catch (error) {
    throw createError("zip_codes.lookup_failed", 502);
  }

  if (!response.ok) {
    throw createError("zip_codes.lookup_failed", 502);
  }

  const payload = await response.json();

  if (payload.erro) {
    throw createError("zip_codes.not_found", 404);
  }

  return {
    zip_code: payload.cep || normalizedZipCode,
    street: payload.logradouro || "",
    complement: payload.complemento || "",
    district: payload.bairro || "",
    city: payload.localidade || "",
    state: payload.uf || ""
  };
}

module.exports = {
  lookupZipCode
};
