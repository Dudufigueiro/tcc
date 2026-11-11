/**
 * Serviços dos dados-base (CRUD) gerenciados pelo gestor.
 * Todos expõem a mesma interface: listar, criar, atualizar, remover.
 */
import { api } from '@/services/api'

function crud(recurso) {
  return {
    async listar(params) {
      return (await api.get(`/${recurso}`, { params })).data
    },
    async criar(dados) {
      return (await api.post(`/${recurso}`, dados)).data
    },
    async atualizar(id, dados) {
      return (await api.put(`/${recurso}/${id}`, dados)).data
    },
    async remover(id) {
      await api.delete(`/${recurso}/${id}`)
    },
  }
}

export const disciplinaService = crud('disciplinas')
export const turmaService = crud('turmas')
export const criterioService = crud('criterios-prioridade')

// Vagas: a listagem devolve { ano_letivo, vagas }, então adaptamos para a interface do CRUD
const vagasCrud = crud('vagas')
export const vagaService = {
  ...vagasCrud,
  async listar(params) {
    return (await api.get('/vagas', { params })).data.vagas
  },
  /** Listagem completa (inclui compatibilidade para o professor). */
  async listarCompleta(params) {
    return (await api.get('/vagas', { params })).data
  },
  async anosLetivos() {
    return (await api.get('/vagas/anos-letivos')).data
  },
}
