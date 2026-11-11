<template>
  <q-layout view="hHh LpR lFf">
    <q-header class="bg-primary text-white no-print">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Abrir menu"
          @click="menuAberto = !menuAberto"
        />
        <q-toolbar-title class="text-subtitle1 text-weight-medium">
          Carga Horária Docente
          <span class="gt-xs text-caption q-ml-sm" style="opacity: 0.75"
            >EEB José Marcolino Eckert</span
          >
        </q-toolbar-title>

        <q-chip
          dense
          square
          :color="auth.isGestor ? 'white' : 'white'"
          :text-color="auth.isGestor ? 'primary' : 'secondary'"
          :icon="auth.isGestor ? 'admin_panel_settings' : 'person'"
          class="gt-xs"
        >
          {{ auth.isGestor ? 'Gestor' : 'Professor' }}
        </q-chip>
        <q-btn flat no-caps dense icon="account_circle" :label="primeiroNome" class="q-ml-sm">
          <q-menu auto-close>
            <q-list style="min-width: 220px">
              <q-item-label header class="text-weight-medium">{{
                auth.usuario?.nome
              }}</q-item-label>
              <q-item-label caption class="q-px-md q-pb-sm">{{ auth.usuario?.email }}</q-item-label>
              <q-separator />
              <q-item clickable @click="sair">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Sair</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="menuAberto" show-if-above bordered :width="260" class="no-print">
      <q-scroll-area class="fit">
        <q-list padding class="q-pt-md">
          <template v-for="(grupo, i) in menu" :key="i">
            <q-item-label v-if="grupo.titulo" header class="text-uppercase text-caption">
              {{ grupo.titulo }}
            </q-item-label>
            <q-item
              v-for="item in grupo.itens"
              :key="item.to"
              v-ripple
              clickable
              :to="item.to"
              :exact="item.exact"
              active-class="menu-ativo"
            >
              <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
              <q-item-section>{{ item.label }}</q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

const auth = useAuthStore()
const router = useRouter()
const menuAberto = ref(false)

const primeiroNome = computed(() => (auth.usuario?.nome || '').split(' ')[0])

const menuProfessor = [
  {
    itens: [
      { to: '/professor/vagas', icon: 'event_available', label: 'Vagas disponíveis' },
      { to: '/professor/escolhas', icon: 'fact_check', label: 'Minhas escolhas' },
    ],
  },
]

const menuGestor = [
  {
    titulo: 'Acompanhamento',
    itens: [
      { to: '/gestor', icon: 'dashboard', label: 'Painel', exact: true },
      { to: '/gestor/escolhas', icon: 'rule', label: 'Escolhas e disputas' },
      { to: '/gestor/professores', icon: 'groups', label: 'Professores' },
      { to: '/gestor/historico', icon: 'history', label: 'Histórico de alterações' },
      { to: '/gestor/relatorio', icon: 'summarize', label: 'Relatório consolidado' },
    ],
  },
  {
    titulo: 'Dados-base',
    itens: [
      { to: '/gestor/disciplinas', icon: 'menu_book', label: 'Disciplinas' },
      { to: '/gestor/turmas', icon: 'class', label: 'Turmas' },
      { to: '/gestor/vagas', icon: 'event_seat', label: 'Vagas' },
      { to: '/gestor/criterios', icon: 'low_priority', label: 'Critérios de prioridade' },
    ],
  },
]

const menu = computed(() => (auth.isGestor ? menuGestor : menuProfessor))

function sair() {
  auth.logout()
  router.push('/login')
}
</script>

<style>
.menu-ativo {
  background: rgba(31, 78, 121, 0.1);
  color: var(--q-primary);
  font-weight: 500;
}
</style>
