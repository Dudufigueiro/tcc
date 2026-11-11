const authService = require('../services/auth.service');

async function login(req, res) {
  res.json(await authService.login(req.valid.body));
}

async function solicitarCadastro(req, res) {
  const usuario = await authService.solicitarCadastro(req.valid.body);
  res.status(201).json({
    mensagem: 'Cadastro solicitado. Aguarde a validação pelo gestor escolar.',
    usuario,
  });
}

async function me(req, res) {
  res.json({ usuario: await authService.carregarUsuarioPublico(req.user.id) });
}

module.exports = { login, solicitarCadastro, me };