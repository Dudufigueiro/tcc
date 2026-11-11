export const opcoesTurno = [
  { value: 'MATUTINO', label: 'Matutino' },
  { value: 'VESPERTINO', label: 'Vespertino' },
  { value: 'NOTURNO', label: 'Noturno' },
]

export const turnoLabel = (turno) =>
  opcoesTurno.find((t) => t.value === turno)?.label ?? turno ?? ''

export function formatarData(valor) {
  if (!valor) return '—'
  const [ano, mes, dia] = String(valor).slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatarDataHora(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// Rótulos e cores (paleta do Quasar) dos status exibidos nos chips
export const STATUS_ESCOLHA = {
  CONFIRMADA: { label: 'Confirmada', color: 'positive', icon: 'check_circle' },
  EM_DISPUTA: { label: 'Em disputa', color: 'warning', icon: 'hourglass_top' },
  CANCELADA: { label: 'Cancelada', color: 'grey-6', icon: 'cancel' },
}

export const STATUS_CADASTRO = {
  PENDENTE: { label: 'Pendente', color: 'warning', icon: 'hourglass_top' },
  APROVADO: { label: 'Aprovado', color: 'positive', icon: 'verified' },
  REJEITADO: { label: 'Rejeitado', color: 'negative', icon: 'block' },
}

export const SITUACAO_VAGA = {
  LIVRE: { label: 'Livre', color: 'positive', icon: 'event_available' },
  OCUPADA: { label: 'Preenchida', color: 'grey-7', icon: 'event_busy' },
  EM_DISPUTA: { label: 'Em disputa', color: 'warning', icon: 'hourglass_top' },
}

export const ACAO_HISTORICO = {
  REGISTRAR: 'Registro da escolha',
  CONFIRMAR: 'Confirmação pelo gestor',
  CANCELAR: 'Cancelamento',
  SUBSTITUIR: 'Substituição pelo gestor',
}

export const opcoesTipoCriterio = [
  { value: 'CLASSIFICACAO', label: 'Classificação (menor posição vence)' },
  { value: 'ANTIGUIDADE', label: 'Antiguidade na unidade (data mais antiga vence)' },
  { value: 'ORDEM_REGISTRO', label: 'Ordem de registro (quem escolheu primeiro)' },
]
