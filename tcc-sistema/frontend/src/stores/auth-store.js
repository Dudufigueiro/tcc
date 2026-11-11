import { defineStore } from 'pinia'
import { authService } from '@/services/auth.service'

const CHAVE = 'carga-horaria:sessao'

function lerSessao() {
  try {
    return JSON.parse(window.localStorage.getItem(CHAVE)) || {}
  } catch {
    return {}
  }
}

function gravarSessao(sessao) {
  try {
    if (sessao) window.localStorage.setItem(CHAVE, JSON.stringify(sessao))
    else window.localStorage.removeItem(CHAVE)
  } catch {
    /* armazenamento indisponível: a sessão vale apenas até recarregar a página */
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const { token = null, usuario = null } = lerSessao()
    return { token, usuario }
  },

  getters: {
    autenticado: (state) => !!state.token && !!state.usuario,
    isGestor: (state) => state.usuario?.perfil === 'GESTOR',
    isProfessor: (state) => state.usuario?.perfil === 'PROFESSOR',
    cadastroAprovado: (state) => state.usuario?.professor?.status_cadastro === 'APROVADO',
    // rota inicial de cada perfil
    rotaInicial() {
      return this.isGestor ? '/gestor' : '/professor/vagas'
    },
  },

  actions: {
    async login(email, senha) {
      const { token, usuario } = await authService.login(email, senha)
      this.token = token
      this.usuario = usuario
      gravarSessao({ token, usuario })
    },

    /** Recarrega os dados do usuário (ex.: após o gestor aprovar o cadastro). */
    async atualizarUsuario() {
      if (!this.token) return
      const { usuario } = await authService.me()
      this.usuario = usuario
      gravarSessao({ token: this.token, usuario })
    },

    logout() {
      this.token = null
      this.usuario = null
      gravarSessao(null)
    },
  },
})
