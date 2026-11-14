<template>
  <q-layout view="hHh LpR lFf">
    <q-btn
      v-if="!desktop && !menuAberto"
      unelevated
      round
      dense
      icon="menu"
      aria-label="Abrir menu"
      class="menu-abrir no-print"
      @click="menuAberto = true"
    />

    <q-drawer
      v-model="menuAberto"
      show-if-above
      :mini="mini"
      :width="260"
      :mini-width="64"
      :class="['menu-lateral', 'no-print', { 'menu-mini': mini }]"
    >
      <div class="column no-wrap fit">
        <div class="menu-marca row no-wrap items-center">
          <q-btn
            flat
            dense
            round
            icon="menu"
            :aria-label="mini ? 'Expandir menu' : 'Recolher menu'"
            @click="alternarMenu"
          />
          <div v-if="!mini" class="menu-marca-texto">
            <div class="menu-marca-nome">Carga Horária Docente</div>
            <div class="menu-marca-escola">EEB José Marcolino Eckert</div>
          </div>
        </div>

        <q-scroll-area class="col">
          <nav aria-label="Menu principal">
            <q-list class="q-py-sm">
              <template v-for="(grupo, i) in menu" :key="i">
                <q-item-label v-if="grupo.titulo && !mini" header class="menu-titulo">
                  {{ grupo.titulo }}
                </q-item-label>
                <div v-else-if="mini && i > 0" class="menu-divisor" />
                <q-item
                  v-for="item in grupo.itens"
                  :key="item.to"
                  clickable
                  :to="item.to"
                  :exact="item.exact"
                  active-class="menu-ativo"
                  class="menu-item"
                >
                  <q-item-section avatar class="menu-icone">
                    <q-icon :name="item.icon" size="19px" />
                  </q-item-section>
                  <q-item-section>{{ item.label }}</q-item-section>
                  <q-tooltip v-if="mini" anchor="center right" self="center left" :offset="[8, 0]">
                    {{ item.label }}
                  </q-tooltip>
                </q-item>
              </template>
            </q-list>
          </nav>
        </q-scroll-area>

        <div class="menu-usuario">
          <div
            class="row no-wrap items-center q-mb-sm"
            :class="{ 'justify-center': mini }"
            :title="`${auth.usuario?.nome} (${perfilLabel})`"
          >
            <div class="menu-avatar" aria-hidden="true">{{ iniciais }}</div>
            <div v-if="!mini" class="menu-usuario-nome">
              {{ auth.usuario?.nome }}
              <span class="menu-usuario-perfil">({{ perfilLabel }})</span>
            </div>
          </div>
          <q-btn
            v-if="!mini"
            outline
            no-caps
            dense
            icon="o_logout"
            label="Sair"
            class="menu-sair full-width"
            @click="sair"
          />
          <q-btn
            v-else
            flat
            round
            dense
            icon="o_logout"
            aria-label="Sair"
            class="menu-sair-mini"
            @click="sair"
          >
            <q-tooltip anchor="center right" self="center left" :offset="[8, 0]">Sair</q-tooltip>
          </q-btn>
        </div>
      </div>
    </q-drawer>

    <q-page-container :class="{ 'menu-fechado': !desktop && !menuAberto }">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth-store'

const auth = useAuthStore()
const router = useRouter()
const $q = useQuasar()
const desktop = computed(() => $q.screen.width >= 1024)

const menuAberto = ref(desktop.value)
const expandido = ref(true)
const mini = computed(() => desktop.value && !expandido.value)

function alternarMenu() {
  if (desktop.value) expandido.value = !expandido.value
  else menuAberto.value = false
}

const perfilLabel = computed(() => (auth.isGestor ? 'Gestor' : 'Professor'))

const iniciais = computed(() => {
  const partes = (auth.usuario?.nome || '').trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return '?'
  const ultima = partes.length > 1 ? partes[partes.length - 1] : ''
  return (partes[0][0] + (ultima[0] || '')).toUpperCase()
})

const menuProfessor = [
  {
    itens: [
      { to: '/professor/vagas', icon: 'o_event_available', label: 'Vagas disponíveis' },
      { to: '/professor/escolhas', icon: 'o_fact_check', label: 'Minhas escolhas' },
    ],
  },
]

const menuGestor = [
  {
    titulo: 'Acompanhamento',
    itens: [
      { to: '/gestor', icon: 'o_grid_view', label: 'Painel', exact: true },
      { to: '/gestor/escolhas', icon: 'o_checklist', label: 'Escolhas e disputas' },
      { to: '/gestor/professores', icon: 'o_groups', label: 'Professores' },
      { to: '/gestor/historico', icon: 'o_history', label: 'Histórico de alterações' },
      { to: '/gestor/relatorio', icon: 'o_description', label: 'Relatório consolidado' },
    ],
  },
  {
    titulo: 'Dados-base',
    itens: [
      { to: '/gestor/disciplinas', icon: 'o_menu_book', label: 'Disciplinas' },
      { to: '/gestor/turmas', icon: 'o_class', label: 'Turmas' },
      { to: '/gestor/vagas', icon: 'o_event_seat', label: 'Vagas' },
      { to: '/gestor/criterios', icon: 'o_filter_alt', label: 'Critérios de prioridade' },
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

.menu-marca {
  min-height: 58px;
  padding: 8px 14px 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #f4f6f8;
}

.menu-marca .q-btn {
  color: #c3c8ce;
}

.menu-divisor {
  margin: 10px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.menu-mini .menu-marca {
  padding: 8px 0;
  justify-content: center;
}

.menu-mini .menu-item {
  padding: 0;
  justify-content: center;
}

.menu-mini .menu-item .menu-icone {
  min-width: 0;
  width: 100%;
  padding: 0;
  align-items: center;
}

.menu-mini .menu-usuario {
  padding: 14px 0 16px;
  text-align: center;
}

.menu-mini .menu-avatar {
  margin-right: 0;
}

.menu-sair-mini {
  color: #c3c8ce;
}

.menu-abrir {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 2000;
  width: 36px;
  height: 36px;
  background: #2b2e32;
  color: #f1f3f5;
}

.menu-fechado .page {
  padding-top: 58px;
}

.menu-marca-texto {
  min-width: 0;
  margin-left: 10px;
}

.menu-marca-nome {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.25;
}

.menu-marca-escola {
  margin-top: 1px;
  font-size: 0.66rem;
  line-height: 1.3;
  color: #98a0a8;
}

.menu-lateral,
.menu-lateral .q-drawer__content {
  background: #2b2e32;
  color: #e3e6e9;
}

.menu-titulo {
  padding: 22px 20px 8px;
  font-size: 0.63rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #9ea5ad;
}

.menu-item {
  min-height: 40px;
  padding: 0 20px;
  font-size: 0.84rem;
  color: #dfe2e6;
  border-left: 3px solid transparent;
  padding-left: 17px;
}

.menu-item .menu-icone {
  min-width: 36px;
  color: #7f868e;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.menu-item.menu-ativo {
  background: #e8eef5;
  border-left-color: #1f4e79;
  color: #1f4e79;
  font-weight: 600;
}

.menu-item.menu-ativo .menu-icone {
  color: #1f4e79;
}

.menu-item.menu-ativo .q-focus-helper {
  display: none;
}

.menu-usuario {
  padding: 14px 20px 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.menu-avatar {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  margin-right: 10px;
  border-radius: 50%;
  background: #454a51;
  color: #f1f3f5;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-usuario-nome {
  min-width: 0;
  font-size: 0.79rem;
  font-weight: 500;
  line-height: 1.3;
  color: #f1f3f5;
  overflow-wrap: anywhere;
}

.menu-usuario-perfil {
  font-weight: 400;
  color: #98a0a8;
}

.menu-sair {
  min-height: 32px;
  font-size: 0.79rem;
  color: #dfe2e6;
  border-radius: 3px;
}

.menu-sair::before {
  border-color: rgba(255, 255, 255, 0.24);
}

.menu-sair:hover {
  background: rgba(255, 255, 255, 0.07);
}
</style>