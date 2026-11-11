const { query, withTransaction } = require('../config/database');
const AppError = require('../utils/AppError');
const { anoLetivoPadrao } = require('../utils/sql');
const { PERFIL, STATUS_ESCOLHA, ACAO_HISTORICO } = require('../utils/constants');
const vagaService = require('./vaga.service');
const validacao = require('./validacao.service');
const prioridade = require('./prioridade.service');
const historico = require('./historico.service');

const SELECT_ESCOLHA = `
SELECT e.id, e.status, e.data_registro, e.professor_id, e.vaga_id,
       pu.nome AS professor_nome, p.matricula, p.classificacao,
       p.data_chegada_unidade, p.regime_carga_horaria,
       v.quantidade_aulas, v.tipo_vaga,
       d.id AS disciplina_id, d.codigo AS disciplina_codigo, d.nome AS disciplina_nome,
       t.id AS turma_id, t.serie, t.identificacao, t.turno, t.matriz, t.ano_letivo
  FROM escolha e
  JOIN professor p ON p.id = e.professor_id
  JOIN usuario pu ON pu.id = p.usuario_id
  JOIN vaga v ON v.id = e.vaga_id
  JOIN turma t ON t.id = v.turma_id
  JOIN disciplina d ON d.id = v.disciplina_id`;

const snapshot = (e, extra = {}) => ({
  status: e.status,
  professor: e.professor_nome,
  matricula: e.matricula,
  disciplina: e.disciplina_nome,
  turma: `${e.serie} ${e.identificacao}`,
  turno: e.turno,
  quantidade_aulas: e.quantidade_aulas,
  ...extra,
});

async function detalhar(id, client) {
  const { rows } = await query(`${SELECT_ESCOLHA} WHERE e.id = $1`, [id], client);
  if (!rows[0]) throw AppError.notFound('Escolha não encontrada.');
  return rows[0];
}

/** Define de qual professor é a escolha: o próprio (professor) ou o informado (gestor). */
function resolverProfessorId(usuario, professorIdInformado) {
  if (usuario.perfil === PERFIL.PROFESSOR) {
    if (!usuario.professorId) throw AppError.forbidden('Usuário não possui cadastro de professor.');
    if (professorIdInformado && professorIdInformado !== usuario.professorId) {
      throw AppError.forbidden('Você só pode registrar escolhas em seu próprio nome.');
    }
    return usuario.professorId;
  }
  if (!professorIdInformado) throw AppError.badRequest('Informe o professor para o qual a escolha será registrada.');
  return professorIdInformado;
}

/** Trava vaga e professor (nessa ordem) para serializar escolhas concorrentes. */
async function travar(client, vagaId, professorId) {
  const vaga = await query('SELECT id FROM vaga WHERE id = $1 FOR UPDATE', [vagaId], client);
  if (!vaga.rowCount) throw AppError.notFound('Vaga não encontrada.');
  const prof = await query('SELECT id FROM professor WHERE id = $1 FOR UPDATE', [professorId], client);
  if (!prof.rowCount) throw AppError.notFound('Professor não encontrado.');
}

async function validar(usuario, { vaga_id, professor_id }) {
  const professorId = resolverProfessorId(usuario, professor_id);
  const vaga = await vagaService.buscarPorId(vaga_id);
  const ctx = await validacao.carregarContexto(professorId, vaga.ano_letivo);
  const erros = validacao.avaliar(vaga, ctx);
  const apenasIndisponivel = erros.length > 0 && erros.every((e) => e.codigo === 'VAGA_INDISPONIVEL');

  return {
    valida: erros.length === 0,
    erros,
    situacao_vaga: vaga.situacao,
    permite_interesse: apenasIndisponivel,
    carga: { utilizada: ctx.cargaUtilizada, regime: ctx.regime, desta_vaga: vaga.quantidade_aulas },
  };
}

async function registrar(usuario, { vaga_id, professor_id, registrar_interesse }) {
  const professorId = resolverProfessorId(usuario, professor_id);

  return withTransaction(async (client) => {
    await travar(client, vaga_id, professorId);

    const vaga = await vagaService.buscarPorId(vaga_id, client);
    const ctx = await validacao.carregarContexto(professorId, vaga.ano_letivo, { client });

    let erros = validacao.avaliar(vaga, ctx);
    const apenasIndisponivel = erros.length > 0 && erros.every((e) => e.codigo === 'VAGA_INDISPONIVEL');
    if (registrar_interesse) erros = erros.filter((e) => e.codigo !== 'VAGA_INDISPONIVEL');

    if (erros.length) {
      throw AppError.unprocessable('A escolha não pôde ser registrada.', {
        code: 'VALIDACAO_ESCOLHA',
        details: { erros, permite_interesse: apenasIndisponivel },
      });
    }

    // vaga livre -> confirmada na hora; vaga ocupada/contestada -> interesse (em disputa)
    const status = vaga.situacao === 'LIVRE' ? STATUS_ESCOLHA.CONFIRMADA : STATUS_ESCOLHA.EM_DISPUTA;
    const { rows } = await query(
      'INSERT INTO escolha (professor_id, vaga_id, status) VALUES ($1, $2, $3) RETURNING id',
      [professorId, vaga_id, status],
      client,
    );

    const escolha = await detalhar(rows[0].id, client);
    await historico.registrar(client, {
      escolhaId: escolha.id,
      usuarioId: usuario.id,
      acao: ACAO_HISTORICO.REGISTRAR,
      novos: snapshot(escolha, usuario.perfil === PERFIL.GESTOR ? { registrado_pelo_gestor: true } : {}),
    });
    return escolha;
  });
}

/**
 * Gestor confirma uma escolha EM_DISPUTA. Se a vaga já estava confirmada para outro professor,
 * essa escolha é cancelada (substituição). As regras são reavaliadas antes de confirmar.
 */
async function confirmar(usuario, id) {
  const previa = await detalhar(id);

  return withTransaction(async (client) => {
    await travar(client, previa.vaga_id, previa.professor_id);

    const { rows: travada } = await query('SELECT status FROM escolha WHERE id = $1 FOR UPDATE', [id], client);
    if (travada[0]?.status !== STATUS_ESCOLHA.EM_DISPUTA) {
      throw AppError.conflict('Somente escolhas em disputa podem ser confirmadas.');
    }

    const vaga = await vagaService.buscarPorId(previa.vaga_id, client);
    const ctx = await validacao.carregarContexto(previa.professor_id, vaga.ano_letivo, {
      client,
      ignorarEscolhaId: id,
    });
    const erros = validacao.avaliar(vaga, ctx, { ignorarSituacao: true });
    if (erros.length) {
      throw AppError.unprocessable('A escolha não pode ser confirmada porque viola as regras de validação.', {
        code: 'VALIDACAO_ESCOLHA',
        details: { erros },
      });
    }

    // cancela quem ocupava a vaga (se houver) antes de confirmar a nova escolha
    const { rows: atuais } = await query(
      `SELECT id FROM escolha WHERE vaga_id = $1 AND status = 'CONFIRMADA' FOR UPDATE`,
      [previa.vaga_id],
      client,
    );
    for (const atual of atuais) {
      const antes = await detalhar(atual.id, client);
      await query(`UPDATE escolha SET status = 'CANCELADA' WHERE id = $1`, [atual.id], client);
      await historico.registrar(client, {
        escolhaId: atual.id,
        usuarioId: usuario.id,
        acao: ACAO_HISTORICO.SUBSTITUIR,
        anteriores: snapshot(antes),
        novos: snapshot(antes, { status: STATUS_ESCOLHA.CANCELADA, motivo: 'Substituída por decisão do gestor.', substituida_pela_escolha: id }),
      });
    }

    await query(`UPDATE escolha SET status = 'CONFIRMADA' WHERE id = $1`, [id], client);
    const depois = await detalhar(id, client);
    await historico.registrar(client, {
      escolhaId: id,
      usuarioId: usuario.id,
      acao: ACAO_HISTORICO.CONFIRMAR,
      anteriores: snapshot(previa),
      novos: snapshot(depois),
    });
    return depois;
  });
}

/** Cancelamento: o professor cancela a própria escolha; o gestor cancela qualquer uma. */
async function cancelar(usuario, id, motivo) {
  return withTransaction(async (client) => {
    const { rows: travada } = await query('SELECT status FROM escolha WHERE id = $1 FOR UPDATE', [id], client);
    if (!travada[0]) throw AppError.notFound('Escolha não encontrada.');

    const antes = await detalhar(id, client);
    if (usuario.perfil === PERFIL.PROFESSOR && antes.professor_id !== usuario.professorId) {
      throw AppError.forbidden('Você só pode cancelar as suas próprias escolhas.');
    }
    if (antes.status === STATUS_ESCOLHA.CANCELADA) {
      throw AppError.conflict('Esta escolha já está cancelada.');
    }

    await query(`UPDATE escolha SET status = 'CANCELADA' WHERE id = $1`, [id], client);
    const depois = await detalhar(id, client);
    await historico.registrar(client, {
      escolhaId: id,
      usuarioId: usuario.id,
      acao: ACAO_HISTORICO.CANCELAR,
      anteriores: snapshot(antes),
      novos: snapshot(depois, { motivo: motivo || null }),
    });
    return depois;
  });
}

async function listar(usuario, filtros) {
  const ano = filtros.ano_letivo ?? (await anoLetivoPadrao());
  const where = ['t.ano_letivo = $1'];
  const values = [ano];
  const add = (cond, value) => {
    values.push(value);
    where.push(cond.replace('?', `$${values.length}`));
  };

  if (usuario.perfil === PERFIL.PROFESSOR) add('e.professor_id = ?', usuario.professorId ?? 0);
  else if (filtros.professor_id) add('e.professor_id = ?', filtros.professor_id);
  if (filtros.status) add('e.status = ?', filtros.status);
  if (filtros.turma_id) add('t.id = ?', filtros.turma_id);
  if (filtros.disciplina_id) add('d.id = ?', filtros.disciplina_id);

  const { rows } = await query(
    `${SELECT_ESCOLHA} WHERE ${where.join(' AND ')} ORDER BY e.data_registro DESC, e.id DESC`,
    values,
  );
  return { ano_letivo: ano, escolhas: rows };
}

/**
 * Vagas com interessados em disputa. Os candidatos (inclusive quem já ocupa a vaga) vêm
 * ordenados pelos critérios de prioridade e sinalizados com as inconsistências que
 * impediriam a confirmação.
 */
async function listarDisputas(filtros) {
  const ano = filtros.ano_letivo ?? (await anoLetivoPadrao());

  const { rows } = await query(
    `${SELECT_ESCOLHA}
      WHERE t.ano_letivo = $1
        AND e.status IN ('CONFIRMADA', 'EM_DISPUTA')
        AND e.vaga_id IN (SELECT vaga_id FROM escolha WHERE status = 'EM_DISPUTA')
      ORDER BY e.vaga_id, e.id`,
    [ano],
  );

  const porVaga = new Map();
  for (const r of rows) {
    if (!porVaga.has(r.vaga_id)) porVaga.set(r.vaga_id, []);
    porVaga.get(r.vaga_id).push(r);
  }

  const disputas = [];
  for (const [vagaId, escolhas] of porVaga) {
    const base = escolhas[0];
    const ordenados = await prioridade.ordenar(
      escolhas.map((e) => ({ ...e, escolha_id: e.id })),
    );

    const vaga = await vagaService.buscarPorId(vagaId);
    const candidatos = [];
    for (const c of ordenados) {
      let erros = [];
      if (c.status === STATUS_ESCOLHA.EM_DISPUTA) {
        const ctx = await validacao.carregarContexto(c.professor_id, ano, { ignorarEscolhaId: c.id });
        erros = validacao.avaliar(vaga, ctx, { ignorarSituacao: true });
      }
      candidatos.push({
        escolha_id: c.id,
        professor_id: c.professor_id,
        professor_nome: c.professor_nome,
        matricula: c.matricula,
        classificacao: c.classificacao,
        data_chegada_unidade: c.data_chegada_unidade,
        data_registro: c.data_registro,
        status: c.status,
        posicao: c.posicao,
        atual: c.status === STATUS_ESCOLHA.CONFIRMADA,
        pode_confirmar: c.status === STATUS_ESCOLHA.EM_DISPUTA && erros.length === 0,
        erros,
      });
    }

    disputas.push({
      vaga: {
        id: vagaId,
        disciplina_nome: base.disciplina_nome,
        turma: `${base.serie} ${base.identificacao}`,
        turno: base.turno,
        quantidade_aulas: base.quantidade_aulas,
      },
      candidatos,
    });
  }
  return { ano_letivo: ano, disputas };
}

module.exports = { validar, registrar, confirmar, cancelar, listar, listarDisputas, detalhar };