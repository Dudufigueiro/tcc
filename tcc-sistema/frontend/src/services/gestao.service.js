import { api } from '@/services/api'

export const painelService = {
  async resumo(params) {
    return (await api.get('/painel/resumo', { params })).data
  },
}

export const historicoService = {
  async listar(params) {
    return (await api.get('/historico', { params })).data
  },
}

export const relatorioService = {
  async consolidado(params) {
    return (await api.get('/relatorios/consolidado', { params })).data
  },
  /** Baixa o CSV (a rota exige o token, por isso não usamos um link direto). */
  async baixarCsv(params) {
    const res = await api.get('/relatorios/consolidado.csv', { params, responseType: 'blob' })
    const url = window.URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-consolidado-${params?.ano_letivo ?? 'atual'}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  },
}
