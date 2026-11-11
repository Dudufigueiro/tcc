const professorService = require('../services/professor.service');

async function listar(req, res) {
  res.json(await professorService.listar(req.valid.query));
}

async function buscar(req, res) {
  res.json(await professorService.buscar(req.valid.params.id));
}

async function criar(req, res) {
  res.status(201).json(await professorService.criar(req.valid.body));
}

async function atualizar(req, res) {
  res.json(await professorService.atualizar(req.valid.params.id, req.valid.body));
}

async function validarCadastro(req, res) {
  res.json(await professorService.validarCadastro(req.valid.params.id, req.valid.body));
}

async function remover(req, res) {
  await professorService.remover(req.valid.params.id);
  res.status(204).end();
}

async function meuResumo(req, res) {
  res.json(await professorService.meuResumo(req.user));
}

module.exports = { listar, buscar, criar, atualizar, validarCadastro, remover, meuResumo };