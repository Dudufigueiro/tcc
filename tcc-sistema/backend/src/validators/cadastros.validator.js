const { z, id, anoLetivo, turno } = require('./common.validator');

const disciplina = z.object({
  codigo: z.string().trim().min(1).max(20),
  nome: z.string().trim().min(2).max(120),
  area: z.string().trim().max(80).nullish(),
});

const turma = z.object({
  serie: z.string().trim().min(1).max(20),
  identificacao: z.string().trim().min(1).max(10),
  turno,
  matriz: z.string().trim().max(20).nullish(),
  numero_alunos: z.coerce.number().int().min(0).nullish(),
  ano_letivo: anoLetivo,
});

const criterio = z.object({
  descricao: z.string().trim().min(3).max(150),
  tipo: z.enum(['CLASSIFICACAO', 'ANTIGUIDADE', 'ORDEM_REGISTRO']),
  ordem: z.coerce.number().int().min(1).max(99),
  ativo: z.boolean().default(true),
});

const vaga = z.object({
  turma_id: id,
  disciplina_id: id,
  quantidade_aulas: z.coerce.number().int().min(1).max(40),
  tipo_vaga: z.string().trim().min(1).max(40).default('REGULAR'),
});

const filtrosTurma = z.object({
  ano_letivo: z.coerce.number().int().optional(),
  turno: turno.optional(),
});

const filtrosVaga = z.object({
  ano_letivo: z.coerce.number().int().optional(),
  turno: turno.optional(),
  turma_id: id.optional(),
  disciplina_id: id.optional(),
  situacao: z.enum(['LIVRE', 'OCUPADA', 'EM_DISPUTA']).optional(),
  somente_compativeis: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

module.exports = {
  disciplina,
  turma,
  criterio,
  vaga,
  filtrosTurma,
  filtrosVaga,
};
