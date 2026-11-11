import { api } from '@/services/api'

export const escolhaService = {
  async listar(params) {
    return (await api.get('/escolhas', { params })).data
  },
  async disputas(params) {
    return (await api.get('/escolhas/disputas', { params })).data
  },
  /** Validação em tempo real (não grava). */
  async validar(dados) {
    return (await api.post('/escolhas/validar', dados)).data
  },
  async registrar(dados) {
    return (await api.post('/escolhas', dados)).data
  },
  async confirmar(id) {
    return (await api.post(`/escolhas/${id}/confirmar`)).data
  },
  async cancelar(id, motivo) {
    return (await api.post(`/escolhas/${id}/cancelar`, { motivo })).data
  },
}
