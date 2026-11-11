const vagaService = require('../services/vaga.service');

async function listar(req, res) {
  res.json(await vagaService.listar(req.valid.query, req.user));
}

async function anosLetivos(req, res) {
  res.json(await vagaService.anosLetivos());
}

async function buscar(req, res) {
  res.json(await vagaService.buscarPorId(req.valid.params.id));
}

async function criar(req, res) {
  res.status(201).json(await vagaService.criar(req.valid.body));
}

async function atualizar(req, res) {
  res.json(await vagaService.atualizar(req.valid.params.id, req.valid.body));
}

async function remover(req, res) {
  await vagaService.remover(req.valid.params.id);
  res.status(204).end();
}

module.exports = { listar, anosLetivos, buscar, criar, atualizar, remover };