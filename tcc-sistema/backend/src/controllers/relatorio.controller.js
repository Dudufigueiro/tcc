const relatorioService = require('../services/relatorio.service');

async function consolidado(req, res) {
  res.json(await relatorioService.consolidado(req.valid.query));
}

async function consolidadoCsv(req, res) {
  const relatorio = await relatorioService.consolidado(req.valid.query);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="relatorio-consolidado-${relatorio.ano_letivo}.csv"`);
  res.send(relatorioService.paraCsv(relatorio));
}

module.exports = { consolidado, consolidadoCsv };