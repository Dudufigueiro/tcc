const AppError = require('../utils/AppError');

const MENSAGENS_CONSTRAINT = {
  uq_usuario_email: 'Já existe um usuário com este e-mail.',
  professor_matricula_key: 'Já existe um professor com esta matrícula.',
  disciplina_codigo_key: 'Já existe uma disciplina com este código.',
  uq_turma: 'Já existe uma turma com esta série e identificação neste ano letivo.',
  criterio_prioridade_tipo_key: 'Já existe um critério cadastrado para este tipo.',
  uq_escolha_vaga_confirmada: 'Esta vaga acabou de ser preenchida por outra escolha. Atualize a lista.',
  uq_escolha_professor_vaga_ativa: 'Já existe uma escolha ativa deste professor para esta vaga.',
};

function errorHandler(err, req, res, next) {
  let status = 500;
  let body = { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno do servidor.' };

  if (err instanceof AppError) {
    status = err.statusCode;
    body = { codigo: err.code, mensagem: err.message, detalhes: err.details };
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    body = { codigo: 'JSON_INVALIDO', mensagem: 'O corpo da requisição não é um JSON válido.' };
  } else if (err.code === '23505') {
    status = 409;
    body = {
      codigo: 'REGISTRO_DUPLICADO',
      mensagem: MENSAGENS_CONSTRAINT[err.constraint] || 'Já existe um registro com estes dados.',
    };
  } else if (err.code === '23503') {
    status = 409;
    const emUso = /is still referenced/i.test(err.detail || '');
    body = {
      codigo: 'REGISTRO_VINCULADO',
      mensagem: emUso
        ? 'Não é possível excluir: o registro está vinculado a outros dados do sistema.'
        : 'Um dos registros referenciados não existe.',
    };
  } else if (err.code === '23514' || err.code === '22P02' || err.code === '23502') {
    status = 400;
    body = { codigo: 'DADO_INVALIDO', mensagem: 'Dados inválidos para o banco de dados.' };
  }

  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  }
  res.status(status).json({ erro: body });
}

module.exports = errorHandler;