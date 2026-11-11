const historicoService = require('../services/historico.service');

async function listar(req, res) {
  res.json(await historicoService.listar(req.valid.query));
}

module.exports = { listar };