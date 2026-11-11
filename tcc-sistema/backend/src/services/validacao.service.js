const { query } = require('../config/database');
const AppError = require('../utils/AppError');

/**
 * @param {number} professorId
 * @param {number} anoLetivo      a carga é avaliada dentro do mesmo ano letivo
 * @param {object} [opts]
 * @param {object} [opts.client]            client de transação
 * @param {number} [opts.ignorarEscolhaId]  escolha a desconsiderar (ao confirmar uma disputa)
 */
async function carregarContexto(professorId, anoLetivo, { client, ignorarEscolhaId = null } = {}) {
  const { rows: prof } = await query(
    `SELECT p.id, p.status_cadastro, p.regime_carga_horaria, u.ativo, u.nome
       FROM professor p JOIN usuario u ON u.id = p.usuario_id
      WHERE p.id = $1`,
    [professorId],
    client,
  );
  if (!prof[0]) throw AppError.notFound('Professor não encontrado.');

  const { rows } = await query(
    `SELECT e.id AS escolha_id, e.status, v.id AS vaga_id, v.quantidade_aulas,
            d.nome AS disciplina_nome, t.serie, t.identificacao
       FROM escolha e
       JOIN vaga v ON v.id = e.vaga_id
       JOIN turma t ON t.id = v.turma_id
       JOIN disciplina d ON d.id = v.disciplina_id
      WHERE e.professor_id = $1
        AND e.status IN ('CONFIRMADA', 'EM_DISPUTA')
        AND t.ano_letivo = $2
        AND ($3::int IS NULL OR e.id <> $3)`,
    [professorId, anoLetivo, ignorarEscolhaId],
    client,
  );

  const ativas = new Map(); // vaga_id -> { escolha_id, status }
  let cargaUtilizada = 0;

  for (const r of rows) {
    ativas.set(r.vaga_id, { escolha_id: r.escolha_id, status: r.status });
    if (r.status !== 'CONFIRMADA') continue; // só escolhas confirmadas consomem carga
    cargaUtilizada += r.quantidade_aulas;
  }

  return {
    professor: prof[0],
    regime: prof[0].regime_carga_horaria,
    cargaUtilizada,
    ativas,
  };
}

/**
 * @returns {{codigo: string, mensagem: string}[]} lista de inconsistências (vazia = válida)
 */
function avaliar(vaga, ctx, { ignorarSituacao = false } = {}) {
  const erros = [];
  const add = (codigo, mensagem) => erros.push({ codigo, mensagem });

  if (!ctx.professor.ativo) {
    add('USUARIO_INATIVO', 'Usuário inativo.');
    return erros;
  }
  if (ctx.professor.status_cadastro !== 'APROVADO') {
    add('CADASTRO_NAO_APROVADO', 'O cadastro do professor ainda não foi validado pelo gestor.');
    return erros;
  }

  const jaAtiva = ctx.ativas.get(vaga.id);
  if (jaAtiva) {
    add(
      'JA_ESCOLHIDA',
      jaAtiva.status === 'CONFIRMADA'
        ? 'Esta vaga já está confirmada para este professor.'
        : 'Este professor já manifestou interesse nesta vaga (em disputa).',
    );
    return erros;
  }

  if (!ignorarSituacao && vaga.situacao !== 'LIVRE') {
    add(
      'VAGA_INDISPONIVEL',
      vaga.situacao === 'OCUPADA'
        ? 'Vaga indisponível: já foi preenchida por outro professor.'
        : 'Vaga indisponível: há professores em disputa aguardando decisão do gestor.',
    );
  }

  const total = ctx.cargaUtilizada + vaga.quantidade_aulas;
  if (total > ctx.regime) {
    add(
      'CARGA_EXCEDIDA',
      `Carga horária excedida: ${ctx.cargaUtilizada} aula(s) já escolhida(s) + ${vaga.quantidade_aulas} desta vaga = ${total}, ` +
        `acima do regime de ${ctx.regime} aulas.`,
    );
  }

  return erros;
}

module.exports = { carregarContexto, avaliar };