const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(AppError.notFound(`Rota não encontrada: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;