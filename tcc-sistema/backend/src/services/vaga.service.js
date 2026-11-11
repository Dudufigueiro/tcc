const { query, withTransaction } = require('../config/database');
const AppError = require('../utils/AppError');
const { anoLetivoPadrao } = require('../utils/sql');
const validacao = require('./validacao.service');

const SELECT_VAGA = `
SELECT v.id, v.quantidade_aulas, v.tipo_vaga,
       t.id AS turma_id, t.serie, t.identificacao, t.turno, t.matriz, t.ano_letivo,
       d.id AS disciplina_id, d.codigo AS disciplina_codigo, d.nome AS disciplina_nome, d.area AS disciplina_area,
       conf.escolha_id AS escolha_confirmada_id,
       conf.professor_id AS professor_confirmado_id,
       conf.professor_nome AS professor_confirmado_nome,
       (SELECT COUNT(*)::int FROM escolha e WHERE e.vaga_id = v.id AND e.status = 'EM_DISPUTA') AS interessados
  FROM vaga v
  JOIN turma t ON t.id = v.turma_id
  JOIN disciplina d ON d.id = v.disciplina_id
  LEFT JOIN LATERAL (
        SELECT e.id AS escolha_id, e.professor_id, u.nome AS professor_nome
          FROM escolha e
          JOIN professor p ON p.id = e.professor_id
          JOIN usuario u ON u.id = p.usuario_id
         WHERE e.vaga_id = v.id AND e.status = 'CONFIRMADA'
         LIMIT 1
  ) conf ON TRUE`;

function enriquecer(v) {
  let situacao = 'LIVRE';
  if (v.escolha_confirmada_id) situacao = 'OCUPADA';
  else if (v.interessados > 0) situacao = 'EM_DISPUTA';
  return { ...v, situacao, disponivel: situacao === 'LIVRE' };
}

async function buscarPorId(id, client) {
  const { rows } = await query(`${SELECT_VAGA} WHERE v.id = $1`, [id], client);
  if (!rows[0]) throw AppError.notFound('Vaga não encontrada.');
  return enriquecer(rows[0]);
}

async function anosLetivos() {
  const { rows } = await query('SELECT DISTINCT ano_letivo FROM turma ORDER BY ano_letivo DESC');
  return rows.map((r) => r.ano_letivo);
}

async function listar(filtros, user) {
  const ano = filtros.ano_letivo ?? (await anoLetivoPadrao());
  const where = ['t.ano_letivo = $1'];
  const values = [ano];
  const add = (cond, value) => {
    values.push(value);
    where.push(cond.replace('?', `$${values.length}`));
  };
  if (filtros.turno) add('t.turno = ?', filtros.turno);
  if (filtros.turma_id) add('t.id = ?', filtros.turma_id);
  if (filtros.disciplina_id) add('d.id = ?', filtros.disciplina_id);

  const { rows } = await query(
    `${SELECT_VAGA} WHERE ${where.join(' AND ')} ORDER BY d.nome, t.serie, t.identificacao, v.id`,
    values,
  );

  let vagas = rows.map(enriquecer);
  if (filtros.situacao) vagas = vagas.filter((v) => v.situacao === filtros.situacao);

  if (user.perfil === 'PROFESSOR') {
    const ctx = await validacao.carregarContexto(user.professorId, ano);
    vagas = vagas.map((v) => {
      const erros = validacao.avaliar(v, ctx);
      const minha = ctx.ativas.get(v.id);
      const apenasIndisponivel = erros.length > 0 && erros.every((e) => e.codigo === 'VAGA_INDISPONIVEL');
      return {
        ...v,
        // o professor não vê quem ocupa a vaga, apenas se é dele
        professor_confirmado_id: undefined,
        professor_confirmado_nome: minha?.status === 'CONFIRMADA' ? ctx.professor.nome : null,
        minha_escolha_status: minha?.status ?? null,
        compativel: erros.length === 0,
        pode_manifestar_interesse: apenasIndisponivel,
        motivos: erros.map((e) => e.mensagem),
      };
    });
    if (filtros.somente_compativeis) vagas = vagas.filter((v) => v.compativel);
  }

  return { ano_letivo: ano, vagas };
}

/** Confere se a turma e a disciplina informadas existem. */
async function validarReferencias(client, turmaId, disciplinaId) {
  const { rows: turmas } = await query('SELECT 1 FROM turma WHERE id = $1', [turmaId], client);
  if (!turmas[0]) throw AppError.badRequest('Turma informada não existe.');
  const { rows: disciplinas } = await query('SELECT 1 FROM disciplina WHERE id = $1', [disciplinaId], client);
  if (!disciplinas[0]) throw AppError.badRequest('Disciplina informada não existe.');
}

async function criar(data) {
  return withTransaction(async (client) => {
    await validarReferencias(client, data.turma_id, data.disciplina_id);
    const { rows } = await query(
      `INSERT INTO vaga (turma_id, disciplina_id, quantidade_aulas, tipo_vaga)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [data.turma_id, data.disciplina_id, data.quantidade_aulas, data.tipo_vaga],
      client,
    );
    return buscarPorId(rows[0].id, client);
  });
}

async function atualizar(id, data) {
  return withTransaction(async (client) => {
    const atual = await buscarPorId(id, client);
    await validarReferencias(client, data.turma_id, data.disciplina_id);

    const alterouEstrutura =
      atual.turma_id !== data.turma_id ||
      atual.disciplina_id !== data.disciplina_id ||
      atual.quantidade_aulas !== data.quantidade_aulas;

    if (alterouEstrutura) {
      const { rows } = await query(
        `SELECT COUNT(*)::int AS n FROM escolha WHERE vaga_id = $1 AND status IN ('CONFIRMADA', 'EM_DISPUTA')`,
        [id],
        client,
      );
      if (rows[0].n > 0) {
        throw AppError.conflict(
          'A vaga possui escolhas ativas. Cancele-as antes de alterar turma, disciplina ou quantidade de aulas.',
        );
      }
    }

    await query(
      `UPDATE vaga SET turma_id = $1, disciplina_id = $2, quantidade_aulas = $3, tipo_vaga = $4 WHERE id = $5`,
      [data.turma_id, data.disciplina_id, data.quantidade_aulas, data.tipo_vaga, id],
      client,
    );
    return buscarPorId(id, client);
  });
}

async function remover(id) {
  const { rowCount } = await query('DELETE FROM vaga WHERE id = $1', [id]);
  if (!rowCount) throw AppError.notFound('Vaga não encontrada.');
}

module.exports = { listar, buscarPorId, anosLetivos, criar, atualizar, remover, enriquecer, SELECT_VAGA };