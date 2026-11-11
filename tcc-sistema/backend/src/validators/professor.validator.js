const { z } = require('./common.validator');

const regime = z.coerce.number().int().min(1).max(60);
const classificacao = z.coerce.number().int().min(1);

const criar = z.object({
  nome: z.string().trim().min(3).max(150),
  email: z.email().max(150),
  senha: z.string().min(6).max(72),
  matricula: z.string().trim().min(1).max(30),
  regime_carga_horaria: regime,
  data_chegada_unidade: z.iso.date().nullish(),
  classificacao: classificacao.nullish(),
});

const atualizar = z.object({
  nome: z.string().trim().min(3).max(150).optional(),
  email: z.email().max(150).optional(),
  senha: z.string().min(6).max(72).optional(),
  matricula: z.string().trim().min(1).max(30).optional(),
  regime_carga_horaria: regime.optional(),
  data_chegada_unidade: z.iso.date().nullish(),
  classificacao: classificacao.nullish(),
  ativo: z.boolean().optional(),
});

const validacao = z
  .object({
    status_cadastro: z.enum(['APROVADO', 'REJEITADO']),
    regime_carga_horaria: regime.optional(),
    classificacao: classificacao.nullish(),
    data_chegada_unidade: z.iso.date().nullish(),
  })
  .refine((d) => d.status_cadastro !== 'APROVADO' || d.regime_carga_horaria, {
    path: ['regime_carga_horaria'],
    message: 'Informe o regime de carga horária para aprovar o cadastro.',
  });

const filtros = z.object({
  status: z.enum(['PENDENTE', 'APROVADO', 'REJEITADO']).optional(),
  ano_letivo: z.coerce.number().int().optional(),
});

module.exports = { criar, atualizar, validacao, filtros };
