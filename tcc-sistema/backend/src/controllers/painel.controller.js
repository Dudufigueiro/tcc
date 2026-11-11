const painelService = require('../services/painel.service');

async function resumo(req, res) {
  res.json(await painelService.resumo(req.valid.query));
}

module.exports = { resumo };