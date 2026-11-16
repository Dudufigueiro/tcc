const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query, withTransaction } = require('../config/database');
const AppError = require('../utils/AppError');

const BCRYPT_ROUNDS = 10;

function gerarToken(usuario) {
  return jwt.sign({ sub: usuario.id, perfil: usuario.perfil }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

async function carregarUsuarioPublico(usuarioId, client) {
  const { rows } = await query(
    `SELECT u.id, u.nome, u.email, u.perfil, u.ativo,
            p.id AS professor_id, p.matricula, p.regime_carga_horaria,
            p.status_cadastro, p.classificacao, p.data_chegada_unidade
       FROM usuario u
       LEFT JOIN professor p ON p.usuario_id = u.id
      WHERE u.id = $1`,
    [usuarioId],
    client,
  );
  const u = rows[0];
  if (!u) throw AppError.notFound('Usuário não encontrado.');
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    perfil: u.perfil,
    professor: u.professor_id
      ? {
          id: u.professor_id,
          matricula: u.matricula,
          regime_carga_horaria: u.regime_carga_horaria,
          status_cadastro: u.status_cadastro,
          classificacao: u.classificacao,
          data_chegada_unidade: u.data_chegada_unidade,
        }
      : null,
  };
}

async function login({ email, senha }) {
  const { rows } = await query('SELECT id, senha_hash, perfil, ativo FROM usuario WHERE LOWER(email) = LOWER($1)', [email]);
  const u = rows[0];

  const credenciaisOk = u && (await bcrypt.compare(senha, u.senha_hash));
  if (!credenciaisOk) throw AppError.unauthorized('E-mail ou senha incorretos.');
  if (!u.ativo) throw AppError.forbidden('Usuário inativo. Procure a gestão escolar.');

  return { token: gerarToken(u), usuario: await carregarUsuarioPublico(u.id) };
}

/** Solicitação de cadastro feita pelo próprio professor (fica PENDENTE até validação do gestor). */
async function solicitarCadastro({ nome, email, senha, matricula, data_chegada_unidade }) {
  const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);

  const usuarioId = await withTransaction(async (client) => {
    const { rows } = await query(
      `INSERT INTO usuario (nome, email, senha_hash, perfil)
       VALUES ($1, $2, $3, 'PROFESSOR') RETURNING id`,
      [nome, email, senhaHash],
      client,
    );
    await query(
      `INSERT INTO professor (usuario_id, matricula, data_chegada_unidade, status_cadastro)
       VALUES ($1, $2, $3, 'PENDENTE')`,
      [rows[0].id, matricula, data_chegada_unidade || null],
      client,
    );
    return rows[0].id;
  });

  return carregarUsuarioPublico(usuarioId);
}

/**
 * Confere a senha atual do usuário logado. Usa 422 (e não 401) para que uma senha digitada
 * errada não derrube a sessão no frontend.
 */
async function conferirSenhaAtual(usuarioId, senhaAtual) {
  const { rows } = await query('SELECT senha_hash FROM usuario WHERE id = $1', [usuarioId]);
  if (!rows[0]) throw AppError.notFound('Usuário não encontrado.');
  const confere = await bcrypt.compare(senhaAtual, rows[0].senha_hash);
  if (!confere) {
    throw AppError.unprocessable('Senha atual incorreta.', { code: 'SENHA_ATUAL_INCORRETA' });
  }
}

/** Troca o e-mail do próprio usuário (exige a senha atual). */
async function alterarEmail(usuarioId, { email, senha_atual }) {
  await conferirSenhaAtual(usuarioId, senha_atual);
  await query('UPDATE usuario SET email = $1 WHERE id = $2', [email.trim(), usuarioId]);
  return carregarUsuarioPublico(usuarioId);
}

/** Troca a senha do próprio usuário (exige a senha atual). */
async function alterarSenha(usuarioId, { senha_atual, nova_senha }) {
  await conferirSenhaAtual(usuarioId, senha_atual);
  if (senha_atual === nova_senha) {
    throw AppError.unprocessable('A nova senha deve ser diferente da senha atual.', {
      code: 'SENHA_IGUAL',
    });
  }
  const senhaHash = await bcrypt.hash(nova_senha, BCRYPT_ROUNDS);
  await query('UPDATE usuario SET senha_hash = $1 WHERE id = $2', [senhaHash, usuarioId]);
}

module.exports = {
  login,
  solicitarCadastro,
  carregarUsuarioPublico,
  alterarEmail,
  alterarSenha,
  BCRYPT_ROUNDS,
};