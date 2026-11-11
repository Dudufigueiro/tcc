import { defineBoot } from '#q-app'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth-store'

export default defineBoot(({ app, store, router }) => {
  const auth = useAuthStore(store)

  api.interceptors.request.use((config) => {
    if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`
    return config
  })

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const erroApi = error.response?.data?.erro
      // sessão expirada/inválida: volta para o login (exceto na própria tentativa de login)
      if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
        auth.logout()
        router.push({ path: '/login', query: { expirou: '1' } })
      }
      // normaliza o erro para as telas: error.mensagem, error.detalhes, error.codigo
      error.codigo = erroApi?.codigo
      error.detalhes = erroApi?.detalhes
      error.mensagem =
        erroApi?.mensagem ||
        (error.response
          ? 'Erro ao processar a requisição.'
          : 'Não foi possível conectar ao servidor.')
      return Promise.reject(error)
    },
  )

  app.config.globalProperties.$api = api
})
