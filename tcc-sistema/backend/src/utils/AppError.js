/**
 * Erro de aplicação com status HTTP e código legível por máquina.
 * É convertido em resposta JSON pelo middleware errorHandler.
 */
class AppError extends Error {
  constructor(statusCode, message, { code, details } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code || 'ERRO';
    this.details = details;
  }

  static badRequest(message, opts) {
    return new AppError(400, message, { code: 'REQUISICAO_INVALIDA', ...opts });
  }

  static unauthorized(message = 'Não autenticado.', opts) {
    return new AppError(401, message, { code: 'NAO_AUTENTICADO', ...opts });
  }

  static forbidden(message = 'Você não tem permissão para esta ação.', opts) {
    return new AppError(403, message, { code: 'ACESSO_NEGADO', ...opts });
  }

  static notFound(message = 'Registro não encontrado.', opts) {
    return new AppError(404, message, { code: 'NAO_ENCONTRADO', ...opts });
  }

  static conflict(message, opts) {
    return new AppError(409, message, { code: 'CONFLITO', ...opts });
  }

  static unprocessable(message, opts) {
    return new AppError(422, message, { code: 'REGRA_DE_NEGOCIO', ...opts });
  }
}

module.exports = AppError;
