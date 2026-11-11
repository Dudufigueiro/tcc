const escolhaService = require('../services/escolha.service');

async function listar(req, res) {
  res.json(await escolhaService.listar(req.user, req.valid.query));
}

async function disputas(req, res) {
  res.json(await escolhaService.listarDisputas(req.valid.query));
}

async function validar(req, res) {
  res.json(await escolhaService.validar(req.user, req.valid.body));
}

async function registrar(req, res) {
  res.status(201).json(await escolhaService.registrar(req.user, req.valid.body));
}

async function confirmar(req, res) {
  res.json(await escolhaService.confirmar(req.user, req.valid.params.id));
}

async function cancelar(req, res) {
  res.json(await escolhaService.cancelar(req.user, req.valid.params.id, req.valid.body.motivo));
}

module.exports = { listar, disputas, validar, registrar, confirmar, cancelar };