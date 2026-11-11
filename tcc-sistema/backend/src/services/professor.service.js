const bcrypt = require('bcryptjs');
const { query, withTransaction } = require('../config/database');
const AppError = require('../utils/AppError');
const { anoLetivoPadrao } = require('../utils/sql');
const { BCRYPT_ROUNDS } = require('./auth.service');

const SELECT_PROFESSOR = (anoParam) => `
SELECT p.id, p.usuario_id, u.nome, u.email, u.ativo, u.criado_em,
       p.matricula, p.regime_carga_horaria, p.data_chegada_unidade,
       p.classificacao, p.status_cadastro,
       COALESCE((
         SELECT SUM(v.quantidade_aulas)
           FROM escolha e
           JOIN vaga v ON v.id = e.vaga_id
           JOIN turma t ON t.id = v.turma_id
          WHERE e.professor_id = p.id AND e.status = 'CONFIRMADA' AND t.ano_letivo = ${anoParam}
       ), 0)::int AS carga_utilizada
  FROM professor p
  JOIN usuario u ON u.id = p.usuario_id`;

async function listar({ status } = {}) {
  const ano = await anoLetivoPadrao();
  const { rows } = await query(
    `${SELECT_PROFESSOR('$1')}
      WHERE ($2::text IS NULL OR p.status_cadastro = $2)
      ORDER BY CASE p.status_cadastro WHEN 'PENDENTE' THEN 0 ELSE 1 END, u.nome`,
    [ano, status ?? null],
  );
  return { ano_letivo: ano, professores: rows };
}

async function buscar(id, client) {
  const ano = await anoLetivoPadrao(client);
  const { rows } = await query(`${SELECT_PROFESSOR('$1')} WHERE p.id = $2`, [ano, id], client);
  if (!rows[0]) throw AppError.notFound('Professor não encontrado.');
  return rows[0];
}

async function maiorCargaConfirmada(professorId, client) {
  const { rows } = await query(
    `SELECT COALESCE(MAX(soma), 0)::int AS maior FROM (
        SELECT SUM(v.quantidade_aulas) AS soma
          FROM escolha e
          JOIN vaga v ON v.id = e.vaga_id
          JOIN turma t ON t.id = v.turma_id
         WHERE e.professor_id = $1 AND e.status = 'CONFIRMADA'
         GROUP BY t.ano_letivo
     ) s`,
    [professorId],
    client,
  );
  return rows[0].maior;
}

async function atualizarCampos(client, tabela, id, campos) {
  const cols = Object.keys(campos).filter((c) => campos[c] !== undefined);
  if (!cols.length) return;
  const sets = cols.map((c, i) => `${c} = $${i + 1}`);
  await query(
    `UPDATE ${tabela} SET ${sets.join(', ')} WHERE id = $${cols.length + 1}`,
    [...cols.map((c) => campos[c]), id],
    client,
  );
}

/** Cadastro de professor feito diretamente pelo gestor (já nasce aprovado). */
async function criar(data) {
  const senhaHash = await bcrypt.hash(data.senha, BCRYPT_ROUNDS);
  const id = await withTransaction(async (client) => {
    const { rows: u } = await query(
      `INSERT INTO usuario (nome, email, senha_hash, perfil) VALUES ($1, $2, $3, 'PROFESSOR') RETURNING id`,
      [data.nome, data.email, senhaHash],
      client,
    );
    const { rows: p } = await query(
      `INSERT INTO professor (usuario_id, matricula, regime_carga_horaria, data_chegada_unidade, classificacao, status_cadastro)
       VALUES ($1, $2, $3, $4, $5, 'APROVADO') RETURNING id`,
      [u[0].id, data.matricula, data.regime_carga_horaria, data.data_chegada_unidade ?? null, data.classificacao ?? null],
      client,
    );
    return p[0].id;
  });
  return buscar(id);
}

async function atualizar(id, data) {
  await withTransaction(async (client) => {
    const { rows } = await query('SELECT id, usuario_id FROM professor WHERE id = $1 FOR UPDATE', [id], client);
    if (!rows[0]) throw AppError.notFound('Professor não encontrado.');

    if (data.regime_carga_horaria !== undefined) {
      const carga = await maiorCargaConfirmada(id, client);
      if (data.regime_carga_horaria < carga) {
        throw AppError.unprocessable(
          `O regime não pode ser menor que a carga já confirmada (${carga} aulas). Cancele escolhas antes de reduzir.`,
        );
      }
    }

    await atualizarCampos(client, 'usuario', rows[0].usuario_id, {
      nome: data.nome,
      email: data.email,
      ativo: data.ativo,
      senha_hash: data.senha ? await bcrypt.hash(data.senha, BCRYPT_ROUNDS) : undefined,
    });
    await atualizarCampos(client, 'professor', id, {
      matricula: data.matricula,
      regime_carga_horaria: data.regime_carga_horaria,
      data_chegada_unidade: data.data_chegada_unidade,
      classificacao: data.classificacao,
    });
  });
  return buscar(id);
}

/** Validação do cadastro pelo gestor: aprova (definindo o regime de carga horária) ou rejeita. */
async function validarCadastro(id, data) {
  await withTransaction(async (client) => {
    const { rows } = await query('SELECT id FROM professor WHERE id = $1 FOR UPDATE', [id], client);
    if (!rows[0]) throw AppError.notFound('Professor não encontrado.');

    const carga = await maiorCargaConfirmada(id, client);
    if (data.status_cadastro === 'REJEITADO') {
      const { rows: ativas } = await query(
        `SELECT COUNT(*)::int AS n FROM escolha WHERE professor_id = $1 AND status IN ('CONFIRMADA', 'EM_DISPUTA')`,
        [id],
        client,
      );
      if (ativas[0].n > 0) {
        throw AppError.conflict('O professor possui escolhas ativas. Cancele-as antes de rejeitar o cadastro.');
      }
    } else if (data.regime_carga_horaria < carga) {
      throw AppError.unprocessable(`O regime não pode ser menor que a carga já confirmada (${carga} aulas).`);
    }

    await atualizarCampos(client, 'professor', id, {
      status_cadastro: data.status_cadastro,
      regime_carga_horaria: data.regime_carga_horaria,
      classificacao: data.classificacao,
      data_chegada_unidade: data.data_chegada_unidade,
    });
  });
  return buscar(id);
}

/**
 * Exclusão do cadastro do professor (e do usuário de acesso vinculado).
 * Só é permitida quando o professor nunca registrou escolhas: as escolhas (inclusive as canceladas)
 * alimentam o histórico de alterações e o relatório, que precisam ser preservados.
 * Nesse caso o caminho é desativar o usuário (campo "ativo") ou rejeitar o cadastro.
 */
async function remover(id) {
  await withTransaction(async (client) => {
    const { rows } = await query('SELECT id, usuario_id FROM professor WHERE id = $1 FOR UPDATE', [id], client);
    if (!rows[0]) throw AppError.notFound('Professor não encontrado.');

    const { rows: escolhas } = await query(
      'SELECT COUNT(*)::int AS n FROM escolha WHERE professor_id = $1',
      [id],
      client,
    );
    if (escolhas[0].n > 0) {
      throw AppError.conflict(
        'Este professor possui escolhas registradas (inclusive canceladas), que fazem parte do histórico. ' +
          'Para impedir o acesso, edite o cadastro e desative o usuário.',
      );
    }

    // o professor é removido em cascata junto com o usuário
    await query('DELETE FROM usuario WHERE id = $1', [rows[0].usuario_id], client);
  });
}

async function meuResumo(user) {
  if (!user.professorId) throw AppError.forbidden('Usuário não possui cadastro de professor.');
  const professor = await buscar(user.professorId);
  const regime = professor.regime_carga_horaria;
  return {
    ano_letivo: await anoLetivoPadrao(),
    status_cadastro: professor.status_cadastro,
    regime_carga_horaria: regime,
    carga_utilizada: professor.carga_utilizada,
    carga_disponivel: regime == null ? 0 : Math.max(regime - professor.carga_utilizada, 0),
  };
}

module.exports = { listar, buscar, criar, atualizar, validarCadastro, remover, meuResumo };