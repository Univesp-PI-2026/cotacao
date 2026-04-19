function badRequest(res, errors) {
  return res.status(400).json({
    message: "Dados invalidos",
    errors
  });
}

function notFound(res, message = "Registro nao encontrado") {
  return res.status(404).json({ message });
}

function serverError(res, error, message = "Erro interno do servidor") {
  return res.status(500).json({
    message,
    detail: error.message
  });
}

module.exports = {
  badRequest,
  notFound,
  serverError
};
