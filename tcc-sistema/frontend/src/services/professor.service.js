import { api } from '@/services/api'

export const professorService = {
  async listar(params) {
    return (await api.get('/professores', { params })).data
  },
  async criar(dados) {
    return (await api.post('/professores', dados)).data
  },
  async atualizar(id, dados) {
    return (await api.put(`/professores/${id}`, dados)).data
  },
  async validarCadastro(id, dados) {
    return (await api.patch(`/professores/${id}/validacao`, dados)).data
  },
  async remover(id) {
    await api.delete(`/professores/${id}`)
  },
  async meuResumo() {
    return (await api.get('/professores/me/resumo')).data
  },
}
