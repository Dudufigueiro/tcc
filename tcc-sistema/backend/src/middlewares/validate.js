const AppError = require('../utils/AppError');
require('../validators/zod-pt');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const detalhes = result.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensagem: issue.message,
      }));
      throw new AppError(400, 'Dados inválidos. Verifique os campos informados.', {
        code: 'VALIDACAO',
        details: detalhes,
      });
    }
    req.valid = req.valid || {};
    req.valid[source] = result.data;
    next();
  };
}

module.exports = validate;