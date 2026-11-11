const { z, id, anoLetivo } = require('./common.validator');

const registrar = z.object({
  vaga_id: id,
  // somente o gestor pode registrar em nome de outro professor
  professor_id: id.optional(),
  // permite manifestar interesse em vaga ocupada/contestada (fica EM_DISPUTA)
  registrar_interesse: z.boolean().default(false),
});

const validarEscolha = z.object({
  vaga_id: id,
  professor_id: id.optional(),
});

const cancelar = z.object({
  motivo: z.string().trim().max(300).optional(),
});

const filtros = z.object({
  ano_letivo: anoLetivo.optional(),
  status: z.enum(['CONFIRMADA', 'EM_DISPUTA', 'CANCELADA']).optional(),
  professor_id: id.optional(),
  turma_id: id.optional(),
  disciplina_id: id.optional(),
});

const filtrosAno = z.object({ ano_letivo: anoLetivo.optional() });

const filtrosHistorico = z.object({
  escolha_id: id.optional(),
  usuario_id: id.optional(),
  acao: z.enum(['REGISTRAR', 'CONFIRMAR', 'CANCELAR', 'SUBSTITUIR']).optional(),
  limite: z.coerce.number().int().min(1).max(500).default(100),
});

module.exports = { registrar, validarEscolha, cancelar, filtros, filtrosAno, filtrosHistorico };
