const routes = [

  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'inicio', component: () => import('@/pages/InicioRedirect.vue') },

      // Professor
      {
        path: 'professor',
        meta: { perfis: ['PROFESSOR'] },
        children: [
          {
            path: 'vagas',
            name: 'professor-vagas',
            component: () => import('@/pages/professor/VagasPage.vue'),
          },
          {
            path: 'escolhas',
            name: 'professor-escolhas',
            component: () => import('@/pages/professor/MinhasEscolhasPage.vue'),
          },
        ],
      },

      // Gestor
      {
        path: 'gestor',
        meta: { perfis: ['GESTOR'] },
        children: [
          {
            path: '',
            name: 'gestor-painel',
            component: () => import('@/pages/gestor/PainelPage.vue'),
          },
          {
            path: 'professores',
            name: 'gestor-professores',
            component: () => import('@/pages/gestor/ProfessoresPage.vue'),
          },
          {
            path: 'escolhas',
            name: 'gestor-escolhas',
            component: () => import('@/pages/gestor/EscolhasPage.vue'),
          },
          {
            path: 'historico',
            name: 'gestor-historico',
            component: () => import('@/pages/gestor/HistoricoPage.vue'),
          },
          {
            path: 'relatorio',
            name: 'gestor-relatorio',
            component: () => import('@/pages/gestor/RelatorioPage.vue'),
          },
          {
            path: 'disciplinas',
            name: 'gestor-disciplinas',
            component: () => import('@/pages/gestor/DisciplinasPage.vue'),
          },
          {
            path: 'turmas',
            name: 'gestor-turmas',
            component: () => import('@/pages/gestor/TurmasPage.vue'),
          },
          {
            path: 'vagas',
            name: 'gestor-vagas',
            component: () => import('@/pages/gestor/VagasPage.vue'),
          },
          {
            path: 'criterios',
            name: 'gestor-criterios',
            component: () => import('@/pages/gestor/CriteriosPage.vue'),
          },
        ],
      },
    ],
  },

  // Telas públicas
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { publica: true },
    children: [
      { path: 'login', name: 'login', component: () => import('@/pages/auth/LoginPage.vue') },
      {
        path: 'cadastro',
        name: 'cadastro',
        component: () => import('@/pages/auth/CadastroPage.vue'),
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
]

export default routes