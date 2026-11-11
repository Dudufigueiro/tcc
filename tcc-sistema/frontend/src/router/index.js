import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'
import routes from './routes.js'
import { useAuthStore } from '@/stores/auth-store'

export default defineRouter(({ store }) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  })

  // Guard global: exige login e respeita o perfil de cada área
  Router.beforeEach((to) => {
    const auth = useAuthStore(store)
    const publica = to.matched.some((r) => r.meta.publica)

    if (!publica && !auth.autenticado) {
      return { path: '/login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
    }
    if (publica && auth.autenticado) {
      return auth.rotaInicial
    }

    const perfis = to.matched.flatMap((r) => r.meta.perfis ?? [])
    if (perfis.length && !perfis.includes(auth.usuario?.perfil)) {
      return auth.rotaInicial
    }
    return true
  })

  return Router
})
