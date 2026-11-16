const { query } = require('../config/database');
const { anoLetivoPadrao } = require('../utils/sql');
const historico = require('./historico.service');

/** Dados do painel de acompanhamento do gestor. */
async function resumo({ ano_letivo } = {}) {
  const ano = ano_letivo ?? (await anoLetivoPadrao());

  const [professores, vagas, escolhas, cargas, anos, ultimas] = await Promise.all([
    query(`SELECT status_cadastro, COUNT(*)::int AS total FROM professor GROUP BY status_cadastro`),
    query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE conf.id IS NOT NULL)::int AS preenchidas,
              COUNT(*) FILTER (WHERE disp.n > 0)::int AS em_disputa,
              COUNT(*) FILTER (WHERE conf.id IS NULL AND disp.n = 0)::int AS livres,
              COALESCE(SUM(v.quantidade_aulas), 0)::int AS aulas_total,
              COALESCE(SUM(v.quantidade_aulas) FILTER (WHERE conf.id IS NOT NULL), 0)::int AS aulas_atribuidas
         FROM vaga v
         JOIN turma t ON t.id = v.turma_id
         LEFT JOIN LATERAL (SELECT e.id FROM escolha e WHERE e.vaga_id = v.id AND e.status = 'CONFIRMADA' LIMIT 1) conf ON TRUE
         CROSS JOIN LATERAL (SELECT COUNT(*) AS n FROM escolha e WHERE e.vaga_id = v.id AND e.status = 'EM_DISPUTA') disp
        WHERE t.ano_letivo = $1`,
      [ano],
    ),
    query(
      `SELECT e.status, COUNT(*)::int AS total
         FROM escolha e JOIN vaga v ON v.id = e.vaga_id JOIN turma t ON t.id = v.turma_id
        WHERE t.ano_letivo = $1 GROUP BY e.status`,
      [ano],
    ),
    // os 5 professores com maior carga horária livre (regime - aulas já atribuídas)
    query(
      `SELECT c.*
         FROM (
           SELECT p.id, u.nome, p.matricula, p.regime_carga_horaria AS regime,
                  COALESCE(SUM(v.quantidade_aulas) FILTER (WHERE e.status = 'CONFIRMADA' AND t.ano_letivo = $1), 0)::int AS utilizada
             FROM professor p
             JOIN usuario u ON u.id = p.usuario_id
             LEFT JOIN escolha e ON e.professor_id = p.id
             LEFT JOIN vaga v ON v.id = e.vaga_id
             LEFT JOIN turma t ON t.id = v.turma_id
            WHERE p.status_cadastro = 'APROVADO'
            GROUP BY p.id, u.nome, p.matricula, p.regime_carga_horaria
         ) c
        ORDER BY (c.regime - c.utilizada) DESC, c.nome
        LIMIT 5`,
      [ano],
    ),
    query('SELECT DISTINCT ano_letivo FROM turma ORDER BY ano_letivo DESC'),
    historico.listar({ ano_letivo: ano, limite: 5 }),
  ]);

  const contar = (rows, chave, valor) => rows.find((r) => r[chave] === valor)?.total ?? 0;

  return {
    ano_letivo: ano,
    anos_letivos: anos.rows.map((r) => r.ano_letivo),
    professores: {
      pendentes: contar(professores.rows, 'status_cadastro', 'PENDENTE'),
      aprovados: contar(professores.rows, 'status_cadastro', 'APROVADO'),
      rejeitados: contar(professores.rows, 'status_cadastro', 'REJEITADO'),
    },
    vagas: vagas.rows[0],
    escolhas: {
      confirmadas: contar(escolhas.rows, 'status', 'CONFIRMADA'),
      em_disputa: contar(escolhas.rows, 'status', 'EM_DISPUTA'),
      canceladas: contar(escolhas.rows, 'status', 'CANCELADA'),
    },
    carga_professores: cargas.rows,
    ultimas_alteracoes: ultimas,
  };
}

module.exports = { resumo };