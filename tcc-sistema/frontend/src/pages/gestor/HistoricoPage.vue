<template>
  <q-page class="page">
    <PageHeader
      title="Histórico de alterações"
      subtitle="Quem alterou o quê e quando: registros, confirmações, cancelamentos e substituições."
    />

    <div class="row items-center q-col-gutter-sm q-mb-md">
      <div class="col-12 col-sm-auto">
        <q-select
          v-model="filtroAcao"
          :options="opcoesAcao"
          label="Ação"
          dense
          outlined
          clearable
          emit-value
          map-options
          bg-color="white"
          style="min-width: 220px"
        />
      </div>
      <div class="col-12 col-sm">
        <q-input
          v-model="busca"
          dense
          outlined
          clearable
          bg-color="white"
          placeholder="Buscar por usuário, professor ou disciplina..."
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
      <div class="col-auto">
        <q-btn flat round icon="refresh" aria-label="Atualizar" @click="carregar"
          ><q-tooltip>Atualizar</q-tooltip></q-btn
        >
      </div>
    </div>

    <q-table
      flat
      class="card-flat"
      :rows="registros"
      :columns="columns"
      row-key="id"
      :filter="busca"
      :loading="carregando"
      :pagination="{ rowsPerPage: 20, sortBy: 'data_hora', descending: true }"
      no-data-label="Nenhuma alteração registrada."
      rows-per-page-label="Linhas por página"
    >
      <template #body-cell-usuario="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.row.usuario_nome }}</div>
          <q-chip
            dense
            square
            size="sm"
            :color="props.row.usuario_perfil === 'GESTOR' ? 'primary' : 'secondary'"
            text-color="white"
            class="q-ma-none"
          >
            {{ props.row.usuario_perfil === 'GESTOR' ? 'Gestor' : 'Professor' }}
          </q-chip>
        </q-td>
      </template>
      <template #body-cell-escolha="props">
        <q-td :props="props" class="cell-wrap">
          <div>{{ props.row.professor_nome }}</div>
          <div class="text-caption text-muted">
            {{ props.row.disciplina_nome }} · {{ props.row.serie }} {{ props.row.identificacao }}
          </div>
        </q-td>
      </template>
      <template #body-cell-alteracoes="props">
        <q-td :props="props" class="cell-wrap" style="min-width: 260px">
          <div v-for="(linha, i) in alteracoes(props.row)" :key="i" class="text-body2">
            {{ linha }}
          </div>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { historicoService } from '@/services/gestao.service'
import { ACAO_HISTORICO, formatarDataHora, turnoLabel } from '@/utils/format'
import { notificarErro } from '@/utils/notify'

const registros = ref([])
const carregando = ref(false)
const busca = ref('')
const filtroAcao = ref(null)

const opcoesAcao = Object.entries(ACAO_HISTORICO).map(([value, label]) => ({ value, label }))

const columns = [
  {
    name: 'data_hora',
    label: 'Data e hora',
    field: 'data_hora',
    align: 'left',
    sortable: true,
    format: formatarDataHora,
  },
  { name: 'usuario', label: 'Responsável', field: 'usuario_nome', align: 'left', sortable: true },
  {
    name: 'acao',
    label: 'Ação',
    field: 'acao',
    align: 'left',
    sortable: true,
    format: (v) => ACAO_HISTORICO[v] ?? v,
  },
  { name: 'escolha', label: 'Escolha', field: 'professor_nome', align: 'left' },
  { name: 'alteracoes', label: 'Dados modificados', field: 'dados_novos', align: 'left' },
]

const ROTULOS = {
  status: 'Status',
  professor: 'Professor',
  matricula: 'Matrícula',
  disciplina: 'Disciplina',
  turma: 'Turma',
  turno: 'Turno',
  quantidade_aulas: 'Aulas',
  motivo: 'Motivo',
  registrado_pelo_gestor: 'Registrado pelo gestor',
  substituida_pela_escolha: 'Substituída pela escolha nº',
}
const STATUS = { CONFIRMADA: 'Confirmada', EM_DISPUTA: 'Em disputa', CANCELADA: 'Cancelada' }

function valor(chave, v) {
  if (v === null || v === undefined || v === '') return '—'
  if (chave === 'status') return STATUS[v] ?? v
  if (chave === 'turno') return turnoLabel(v)
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não'
  return v
}

/** Lista as diferenças entre os dados anteriores e os novos (ou o estado inicial, no registro). */
function alteracoes(h) {
  const antes = h.dados_anteriores
  const depois = h.dados_novos ?? {}
  if (!antes) {
    const linhas = [`Status: ${valor('status', depois.status)}`]
    if (depois.registrado_pelo_gestor) linhas.push('Registrado pelo gestor em nome do professor')
    return linhas
  }
  const linhas = Object.keys(depois)
    .filter((k) => antes[k] !== depois[k])
    .map(
      (k) =>
        `${ROTULOS[k] ?? k}: ${antes[k] != null ? `${valor(k, antes[k])} → ` : ''}${valor(k, depois[k])}`,
    )
  return linhas.length ? linhas : ['—']
}

async function carregar() {
  carregando.value = true
  try {
    registros.value = await historicoService.listar({
      acao: filtroAcao.value || undefined,
      limite: 500,
    })
  } catch (e) {
    notificarErro(e)
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
watch(filtroAcao, carregar)
</script>
