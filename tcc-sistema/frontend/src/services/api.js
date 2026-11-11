import axios from 'axios'

// Instância única do axios usada por todos os services.
// Em desenvolvimento o Quasar repassa "/api" para o backend (veja devServer.proxy em quasar.config.js).
// Em produção, sirva o front e a API sob o mesmo domínio ou defina VITE_API_URL no build.
// Os interceptors (token, tratamento de erros) são registrados em src/boot/axios.js.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
})
