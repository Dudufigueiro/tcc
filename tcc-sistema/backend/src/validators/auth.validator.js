const { z } = require('./common.validator');

const login = z.object({
  email: z.email(),
  senha: z.string().min(1),
});

const solicitarCadastro = z.object({
  nome: z.string().trim().min(3).max(150),
  email: z.email().max(150),
  senha: z.string().min(6).max(72),
  matricula: z.string().trim().min(1).max(30),
  data_chegada_unidade: z.iso.date().optional(),
});

const alterarEmail = z.object({
  email: z.email().max(150),
  senha_atual: z.string().min(1),
});

const alterarSenha = z.object({
  senha_atual: z.string().min(1),
  nova_senha: z.string().min(6).max(72),
});

module.exports = { login, solicitarCadastro, alterarEmail, alterarSenha };
