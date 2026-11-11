const { query } = require('../config/database');

function comparar(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

const VALOR_POR_TIPO = {
  CLASSIFICACAO: (c) => c.classificacao,
  ANTIGUIDADE: (c) => c.data_chegada_unidade,
  ORDEM_REGISTRO: (c) => (c.data_registro ? new Date(c.data_registro).getTime() : null),
};

async function criteriosAtivos(client) {
  const { rows } = await query(
    'SELECT id, descricao, tipo, ordem FROM criterio_prioridade WHERE ativo ORDER BY ordem, id',
    [],
    client,
  );
  return rows;
}

async function ordenar(candidatos, client) {
  const criterios = await criteriosAtivos(client);

  const ordenados = [...candidatos].sort((x, y) => {
    for (const criterio of criterios) {
      const valor = VALOR_POR_TIPO[criterio.tipo];
      const r = comparar(valor(x), valor(y));
      if (r !== 0) return r;
    }
    return comparar(x.escolha_id, y.escolha_id); // desempate final estável
  });

  return ordenados.map((c, i) => ({ ...c, posicao: i + 1 }));
}

module.exports = { ordenar, criteriosAtivos, comparar };