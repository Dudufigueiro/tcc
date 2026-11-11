const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query } = require('../config/database');
const AppError = require('../utils/AppError');

async function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw AppError.unauthorized('Token de acesso não informado.');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch {
    throw AppError.unauthorized('Sessão inválida ou expirada. Faça login novamente.');
  }

  const { rows } = await query(
    `SELECT u.id, u.nome, u.email, u.perfil, u.ativo,
            p.id AS professor_id, p.status_cadastro
       FROM usuario u
       LEFT JOIN professor p ON p.usuario_id = u.id
      WHERE u.id = $1`,
    [payload.sub],
  );
  const u = rows[0];
  if (!u || !u.ativo) {
    throw AppError.unauthorized('Usuário inexistente ou inativo.');
  }

  req.user = {
    id: u.id,
    nome: u.nome,
    email: u.email,
    perfil: u.perfil,
    professorId: u.professor_id,
    statusCadastro: u.status_cadastro,
  };
  next();
}

module.exports = authenticate;