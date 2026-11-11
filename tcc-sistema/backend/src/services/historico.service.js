const { query } = require('../config/database');
const { anoLetivoPadrao } = require('../utils/sql');

/** Registra uma alteração em uma escolha (usuário responsável, data/hora e dados modificados). */
async function registrar(client, { escolhaId, usuarioId, acao, anteriores = null, novos = null }) {
  await query(
    `INSERT INTO historico_alteracao (escolha_id, usuario_id, acao, dados_anteriores, dados_novos)
     VALUES ($1, $2, $3, $4, $5)`,
    [escolhaId, usuarioId, acao, anteriores && JSON.stringify(anteriores), novos && JSON.stringify(novos)],
    client,
  );
}

async function listar({ escolha_id, usuario_id, acao, ano_letivo, limite = 100 } = {}) {
  const where = [];
  const values = [];
  const add = (cond, value) => {
    values.push(value);
    where.push(cond.replace('?', `$${values.length}`));
  };

  if (escolha_id) add('h.escolha_id = ?', escolha_id);
  if (usuario_id) add('h.usuario_id = ?', usuario_id);
  if (acao) add('h.acao = ?', acao);
  if (ano_letivo) add('t.ano_letivo = ?', ano_letivo);
  values.push(limite);

  const { rows } = await query(
    `SELECT h.id, h.escolha_id, h.data_hora, h.acao, h.dados_anteriores, h.dados_novos,
            u.id AS usuario_id, u.nome AS usuario_nome, u.perfil AS usuario_perfil,
            pu.nome AS professor_nome, d.nome AS disciplina_nome,
            t.serie, t.identificacao, t.ano_letivo
       FROM historico_alteracao h
       JOIN usuario u ON u.id = h.usuario_id
       JOIN escolha e ON e.id = h.escolha_id
       JOIN professor p ON p.id = e.professor_id
       JOIN usuario pu ON pu.id = p.usuario_id
       JOIN vaga v ON v.id = e.vaga_id
       JOIN turma t ON t.id = v.turma_id
       JOIN disciplina d ON d.id = v.disciplina_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY h.data_hora DESC, h.id DESC
      LIMIT $${values.length}`,
    values,
  );
  return rows;
}

module.exports = { registrar, listar, anoLetivoPadrao };
