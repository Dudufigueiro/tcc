import { api } from '@/services/api'

export const authService = {
  async login(email, senha) {
    return (await api.post('/auth/login', { email, senha })).data
  },
  async solicitarCadastro(dados) {
    return (await api.post('/auth/solicitar-cadastro', dados)).data
  },
  async me() {
    return (await api.get('/auth/me')).data
  },
}
