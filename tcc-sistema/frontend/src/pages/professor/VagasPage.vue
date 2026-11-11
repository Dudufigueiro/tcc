<template>
  <q-page class="page">
    <PageHeader
      title="Vagas disponíveis"
      subtitle="Veja as vagas do ano letivo e registre suas escolhas. As regras são verificadas automaticamente."
    />

    <CadastroPendenteBanner :status="resumo?.status_cadastro" />
    <CargaResumo v-if="resumo" :resumo="resumo" class="q-mb-md" />

    <!-- Filtros -->
    <div class="row items-center q-col-gutter-sm q-mb-md">
      <div class="col-auto"><AnoLetivoSelect v-model="ano" /></div>
      <div class="col-6 col-sm-auto">
        <q-select
          v-model="filtros.turno"
          :options="opcoesTurno"
          label="Turno"
          dense
          outlined
          clearable
          emit-value
          map-options
          bg-color="white"
          style="min-width: 150px"
        />
      </div>
      <div class="col-12 col-sm">
        <q-input
          v-model="filtros.busca"
          dense
          outlined
          clearable
          bg-color="white"
          placeholder="Buscar disciplina ou turma..."
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
      <div class="col-12 col-sm-auto">
        <q-toggle v-model="filtros.somenteCompativeis" label="Somente compatíveis comigo" />
      </div>
    </div>

    <q-inner-loading :showing="carregando" />

    <div
      v-if="!carregando && !vagasFiltradas.length"
      class="card-flat q-pa-xl text-center text-muted"
    >
      <q-icon name="event_busy" size="48px" />
      <div class="q-mt-sm">Nenhuma vaga encontrada para os filtros selecionados.</div>
    </div>

    <div class="vaga-grid">
      <div
        v-for="v in vagasFiltradas"
        :key="v.id"
        class="card-flat vaga-card"
        :class="{ 'vaga-minha': v.minha_escolha_status }"
      >
        <div class="row items-start no-wrap">
          <div class="col">
            <div class="vaga-titulo">{{ v.disciplina_nome }}</div>
            <div class="text-muted">
              Turma {{ v.serie }} {{ v.identificacao }} · {{ turnoLabel(v.turno) }}
            </div>
          </div>
          <q-chip dense square color="primary" text-color="white" class="q-ma-none">
            {{ v.quantidade_aulas }} aulas
          </q-chip>
        </div>

        <div class="row items-center justify-between q-mt-xs q-gutter-y-xs">
          <div class="row items-center q-gutter-xs">
            <StatusChip v-if="!v.minha_escolha_status" :status="v.situacao" tipo="vaga" />
            <span class="text-caption text-muted">{{ v.tipo_vaga }}</span>
          </div>

          <!-- Ação conforme o estado da vaga para este professor -->
          <div>
            <q-chip
              v-if="v.minha_escolha_status === 'CONFIRMADA'"
              dense
              square
              color="positive"
              text-color="white"
              icon="check_circle"
              class="q-ma-none"
              >Sua escolha</q-chip
            >
            <q-chip
              v-else-if="v.minha_escolha_status === 'EM_DISPUTA'"
              dense
              square
              color="warning"
              text-color="dark"
              icon="hourglass_top"
              class="q-ma-none"
            >
              Seu interesse
            </q-chip>
            <q-btn
              v-else-if="v.compativel"
              color="secondary"
              unelevated
              no-caps
              dense
              icon="add_task"
              label="Escolher"
              class="q-px-md"
              @click="abrir(v, false)"
            />
            <q-btn
              v-else-if="v.pode_manifestar_interesse"
              outline
              color="accent"
              no-caps
              dense
              icon="front_hand"
              label="Manifestar interesse"
              class="q-px-sm"
              @click="abrir(v, true)"
            />
            <q-btn v-else flat no-caps dense color="grey-7" icon="block" label="Indisponível">
              <q-tooltip class="text-body2" max-width="320px">
                <div v-for="(m, i) in v.motivos" :key="i">{{ m }}</div>
              </q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Por que não é compatível (resumo curto) -->
        <div
          v-if="!v.compativel && !v.minha_escolha_status && v.motivos?.length"
          class="text-caption text-negative"
        >
          {{ v.motivos[0] }}<span v-if="v.motivos.length > 1"> (+{{ v.motivos.length - 1 }})</span>
        </div>
      </div>
    </div>

    <EscolhaDialog
      v-model="dialogo"
      :vaga="vagaSelecionada"
      :interesse="modoInteresse"
      @registrada="recarregar"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import AnoLetivoSelect from '@/components/AnoLetivoSelect.vue'
import StatusChip from '@/components/StatusChip.vue'
import CargaResumo from '@/components/CargaResumo.vue'
import CadastroPendenteBanner from '@/components/CadastroPendenteBanner.vue'
import EscolhaDialog from '@/components/EscolhaDialog.vue'
import { vagaService } from '@/services/cadastros.service'
import { professorService } from '@/services/professor.service'
import { opcoesTurno, turnoLabel } from '@/utils/format'
import { notificarErro } from '@/utils/notify'

const ano = ref(null)
const filtros = reactive({ turno: null, busca: '', somenteCompativeis: false })
const vagas = ref([])
const resumo = ref(null)
const carregando = ref(false)

const dialogo = ref(false)
const vagaSelecionada = ref(null)
const modoInteresse = ref(false)

async function carregarVagas() {
  if (!ano.value) return
  carregando.value = true
  try {
    const dados = await vagaService.listarCompleta({
      ano_letivo: ano.value,
      turno: filtros.turno || undefined,
      somente_compativeis: filtros.somenteCompativeis || undefined,
    })
    vagas.value = dados.vagas
  } catch (e) {
    notificarErro(e)
  } finally {
    carregando.value = false
  }
}

async function carregarResumo() {
  try {
    resumo.value = await professorService.meuResumo()
  } catch (e) {
    notificarErro(e)
  }
}

const recarregar = () => Promise.all([carregarVagas(), carregarResumo()])

onMounted(carregarResumo)
watch([ano, () => filtros.turno, () => filtros.somenteCompativeis], carregarVagas)

const vagasFiltradas = computed(() => {
  const termo = (filtros.busca || '').trim().toLowerCase()
  if (!termo) return vagas.value
  return vagas.value.filter((v) =>
    `${v.disciplina_nome} ${v.serie} ${v.identificacao} ${v.disciplina_codigo}`
      .toLowerCase()
      .includes(termo),
  )
})

function abrir(vaga, interesse) {
  vagaSelecionada.value = vaga
  modoInteresse.value = interesse
  dialogo.value = true
}
</script>
