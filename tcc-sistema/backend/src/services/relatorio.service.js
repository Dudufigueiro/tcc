/**
 * Relatório consolidado: reúne as escolhas confirmadas para apoiar o lançamento manual no SISGESC.
 * O layout acompanha a planilha impressa atual (disciplina, série/turma, turno, matriz, aulas,
 * professor, matrícula, tipo de vaga).
 */
const { query } = require('../config/database');
const { anoLetivoPadrao } = require('../utils/sql');
const { capitalizar } = require('../utils/formatters');
const vagaService = require('./vaga.service');

async function consolidado({ ano_letivo } = {}) {
  const ano = ano_letivo ?? (await anoLetivoPadrao());

  const { rows } = await query(
    `${vagaService.SELECT_VAGA}
      WHERE t.ano_letivo = $1
      ORDER BY d.nome, t.serie, t.identificacao, v.id`,
    [ano],
  );

  // dados do professor que ocupa cada vaga
  const { rows: profs } = await query(
    `SELECT p.id, p.matricula, p.regime_carga_horaria, p.classificacao
       FROM professor p`,
  );
  const profPorId = new Map(profs.map((p) => [p.id, p]));

  const linhas = rows.map(vagaService.enriquecer).map((v) => {
    const prof = v.professor_confirmado_id ? profPorId.get(v.professor_confirmado_id) : null;
    return {
      vaga_id: v.id,
      disciplina_codigo: v.disciplina_codigo,
      disciplina_nome: v.disciplina_nome,
      serie: v.serie,
      turma: v.identificacao,
      turno: v.turno,
      matriz: v.matriz,
      quantidade_aulas: v.quantidade_aulas,
      tipo_vaga: v.tipo_vaga,
      situacao: v.situacao,
      interessados: v.interessados,
      professor_nome: v.professor_confirmado_nome,
      professor_matricula: prof?.matricula ?? null,
      professor_regime: prof?.regime_carga_horaria ?? null,
    };
  });

  const preenchidas = linhas.filter((l) => l.situacao === 'OCUPADA');
  const resumo = {
    vagas_total: linhas.length,
    vagas_preenchidas: preenchidas.length,
    vagas_em_disputa: linhas.filter((l) => l.interessados > 0).length,
    vagas_livres: linhas.filter((l) => l.situacao === 'LIVRE').length,
    aulas_total: linhas.reduce((s, l) => s + l.quantidade_aulas, 0),
    aulas_atribuidas: preenchidas.reduce((s, l) => s + l.quantidade_aulas, 0),
  };

  const porProfessor = new Map();
  for (const l of preenchidas) {
    const chave = l.professor_matricula;
    if (!porProfessor.has(chave)) {
      porProfessor.set(chave, {
        nome: l.professor_nome,
        matricula: l.professor_matricula,
        regime: l.professor_regime,
        total_aulas: 0,
        vagas: [],
      });
    }
    const p = porProfessor.get(chave);
    p.total_aulas += l.quantidade_aulas;
    p.vagas.push(l);
  }
  const professores = [...porProfessor.values()]
    .map((p) => ({ ...p, saldo: (p.regime ?? 0) - p.total_aulas }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  return { ano_letivo: ano, gerado_em: new Date().toISOString(), resumo, professores, linhas };
}

const SITUACAO_TXT = { OCUPADA: 'Preenchida', LIVRE: 'Livre', EM_DISPUTA: 'Em disputa' };

function paraCsv(relatorio) {
  const cabecalho = [
    'Código', 'Disciplina', 'Série', 'Turma', 'Turno', 'Matriz', 'Nº de aulas',
    'Tipo de vaga', 'Situação', 'Professor', 'Matrícula', 'Regime (aulas)',
  ];
  const esc = (valor) => {
    const txt = valor == null ? '' : String(valor);
    return /[;"\n\r]/.test(txt) ? `"${txt.replace(/"/g, '""')}"` : txt;
  };
  const linhas = relatorio.linhas.map((l) =>
    [
      l.disciplina_codigo, l.disciplina_nome, l.serie, l.turma, capitalizar(l.turno), l.matriz,
      l.quantidade_aulas, l.tipo_vaga, SITUACAO_TXT[l.situacao],
      l.professor_nome, l.professor_matricula, l.professor_regime,
    ].map(esc).join(';'),
  );
  return `\uFEFF${[cabecalho.join(';'), ...linhas].join('\r\n')}\r\n`;
}

module.exports = { consolidado, paraCsv };