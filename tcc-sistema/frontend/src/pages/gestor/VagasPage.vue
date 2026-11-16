<template>
  <q-page class="page">
    <PageHeader
      title="Vagas"
      subtitle="Cada vaga é uma disciplina em uma turma, com a quantidade de aulas semanais."
    />

    <CrudTable
      :service="vagaService"
      :columns="columns"
      :fields="fields"
      :params="params"
      :to-form="toForm"
      novo-label="Nova vaga"
    >
      <template #toolbar>
        <AnoLetivoSelect v-model="ano" />
      </template>

      <template #body-cell-situacao="props">
        <q-td :props="props">
          <StatusChip :status="props.row.situacao" tipo="vaga" />
          <div v-if="props.row.interessados" class="text-caption text-warning q-mt-xs">
            +{{ props.row.interessados }} interesse(s) em disputa
          </div>
        </q-td>
      </template>
    </CrudTable>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import CrudTable from '@/components/CrudTable.vue'
import AnoLetivoSelect from '@/components/AnoLetivoSelect.vue'
import StatusChip from '@/components/StatusChip.vue'
import { disciplinaService, turmaService, vagaService } from '@/services/cadastros.service'
import { turnoLabel } from '@/utils/format'
import { notificarErro } from '@/utils/notify'

const ano = ref(null)
const params = computed(() => (ano.value ? { ano_letivo: ano.value } : {}))

const turmas = ref([])
const disciplinas = ref([])

onMounted(async () => {
  try {
    ;[turmas.value, disciplinas.value] = await Promise.all([
      turmaService.listar(),
      disciplinaService.listar(),
    ])
  } catch (e) {
    notificarErro(e)
  }
})

const columns = [
  {
    name: 'disciplina_nome',
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
  {
    name: 'quantidade_aulas',
    label: 'Aulas',
    field: 'quantidade_aulas',
    align: 'right',
    sortable: true,
  },
  { name: 'tipo_vaga', label: 'Tipo', field: 'tipo_vaga', align: 'left' },
  { name: 'situacao', label: 'Situação', field: 'situacao', align: 'left' },
  {
    name: 'professor',
    label: 'Professor',
    field: 'professor_confirmado_nome',
    align: 'left',
    format: (v) => v || '—',
  },
]

const fields = computed(() => [
  {
    name: 'turma_id',
    label: 'Turma',
    type: 'select',
    required: true,
    options: turmas.value
      .filter((t) => !ano.value || t.ano_letivo === ano.value)
      .map((t) => ({
        value: t.id,
        label: `${t.serie} ${t.identificacao} · ${turnoLabel(t.turno)} · ${t.ano_letivo}`,
      })),
  },
  {
    name: 'disciplina_id',
    label: 'Disciplina',
    type: 'select',
    required: true,
    options: disciplinas.value.map((d) => ({ value: d.id, label: `${d.nome} (${d.codigo})` })),
  },
  {
    name: 'quantidade_aulas',
    label: 'Quantidade de aulas semanais',
    type: 'number',
    required: true,
  },
  { name: 'tipo_vaga', label: 'Tipo de vaga', type: 'text', required: true, default: 'REGULAR' },
])

const toForm = (row) => ({
  turma_id: row.turma_id,
  disciplina_id: row.disciplina_id,
  quantidade_aulas: row.quantidade_aulas,
  tipo_vaga: row.tipo_vaga,
})
</script>
