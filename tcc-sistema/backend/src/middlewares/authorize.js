const AppError = require('../utils/AppError');

/** Autorização por perfil. Uso: router.get('/', authorize('GESTOR'), ...) */
function authorize(...perfisPermitidos) {
  return (req, res, next) => {
    if (!req.user) throw AppError.unauthorized();
    if (!perfisPermitidos.includes(req.user.perfil)) throw AppError.forbidden();
    next();
  };
}

module.exports = authorize;