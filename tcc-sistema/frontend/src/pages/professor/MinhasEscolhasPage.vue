<template>
  <q-page class="page">
    <PageHeader
      title="Minhas escolhas"
      subtitle="Acompanhe as aulas escolhidas e o andamento de cada uma."
    />

    <CadastroPendenteBanner :status="resumo?.status_cadastro" />
    <CargaResumo v-if="resumo" :resumo="resumo" class="q-mb-md" />

    <div class="row items-center q-col-gutter-sm q-mb-md">
      <div class="col-auto"><AnoLetivoSelect v-model="ano" /></div>
      <div class="col-auto">
        <q-toggle v-model="mostrarCanceladas" label="Mostrar canceladas" />
      </div>
    </div>

    <q-table
      flat
      class="card-flat"
      :rows="linhas"
      :columns="columns"
      row-key="id"
      :loading="carregando"
      :pagination="{ rowsPerPage: 15 }"
      no-data-label="Você ainda não registrou escolhas neste ano letivo."
      rows-per-page-label="Linhas por página"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <StatusChip :status="props.row.status" />
          <q-tooltip v-if="props.row.status === 'EM_DISPUTA'" max-width="300px">
            Você manifestou interesse nesta vaga. O gestor decidirá com base nos critérios de
            prioridade.
          </q-tooltip>
        </q-td>
      </template>
      <template #body-cell-acoes="props">
        <q-td :props="props" auto-width>
          <q-btn
            v-if="props.row.status !== 'CANCELADA'"
            flat
            no-caps
            dense
            color="negative"
            icon="cancel"
            label="Cancelar"
            @click="cancelar(props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import PageHeader from '@/components/PageHeader.vue'
import AnoLetivoSelect from '@/components/AnoLetivoSelect.vue'
import StatusChip from '@/components/StatusChip.vue'
import CargaResumo from '@/components/CargaResumo.vue'
import CadastroPendenteBanner from '@/components/CadastroPendenteBanner.vue'
import { escolhaService } from '@/services/escolha.service'
import { professorService } from '@/services/professor.service'
import { formatarDataHora, turnoLabel } from '@/utils/format'
import { notificarErro, notificarSucesso } from '@/utils/notify'

const $q = useQuasar()
const ano = ref(null)
const escolhas = ref([])
const resumo = ref(null)
const carregando = ref(false)
const mostrarCanceladas = ref(false)

const linhas = computed(() =>
  mostrarCanceladas.value ? escolhas.value : escolhas.value.filter((e) => e.status !== 'CANCELADA'),
)

const columns = [
  {
    name: 'disciplina',
    label: 'Disciplina',
    field: 'disciplina_nome',
    align: 'left',
    sortable: true,
  },
  {
    name: 'turma',
    label: 'Turma',
    field: (r) => `${r.serie} ${r.identificacao}`,
    align: 'left',
    sortable: true,
  },
  { name: 'turno', label: 'Turno', field: 'turno', align: 'left', format: (v) => turnoLabel(v) },
  { name: 'aulas', label: 'Aulas', field: 'quantidade_aulas', align: 'right', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'left' },
  {
    name: 'data',
    label: 'Registrada em',
    field: 'data_registro',
    align: 'left',
    format: formatarDataHora,
    sortable: true,
  },
  { name: 'acoes', label: '', field: 'acoes', align: 'right' },
]

async function carregarEscolhas() {
  if (!ano.value) return
  carregando.value = true
  try {
    escolhas.value = (await escolhaService.listar({ ano_letivo: ano.value })).escolhas
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

onMounted(carregarResumo)
watch(ano, carregarEscolhas)

function cancelar(escolha) {
  $q.dialog({
    title: 'Cancelar escolha',
    message: `Cancelar ${escolha.disciplina_nome} (${escolha.serie} ${escolha.identificacao})? Informe o motivo (opcional):`,
    prompt: { model: '', type: 'text', outlined: true, dense: true },
    persistent: true,
    cancel: { label: 'Voltar', flat: true, noCaps: true },
    ok: { label: 'Cancelar escolha', color: 'negative', unelevated: true, noCaps: true },
  }).onOk(async (motivo) => {
    try {
      await escolhaService.cancelar(escolha.id, motivo || undefined)
      notificarSucesso('Escolha cancelada.')
      await Promise.all([carregarEscolhas(), carregarResumo()])
    } catch (e) {
      notificarErro(e)
    }
  })
}
</script>
