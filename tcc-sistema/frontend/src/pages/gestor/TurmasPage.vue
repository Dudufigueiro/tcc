<template>
  <q-page class="page">
    <PageHeader title="Turmas" subtitle="Turmas por ano letivo, com turno e matriz curricular." />
    <CrudTable
      :service="turmaService"
      :columns="columns"
      :fields="fields"
      novo-label="Nova turma"
    />
  </q-page>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'
import CrudTable from '@/components/CrudTable.vue'
import { turmaService } from '@/services/cadastros.service'
import { opcoesTurno, turnoLabel } from '@/utils/format'

const hoje = new Date()

const anoSugerido = hoje.getMonth() >= 8 ? hoje.getFullYear() + 1 : hoje.getFullYear()

const columns = [
  { name: 'ano_letivo', label: 'Ano letivo', field: 'ano_letivo', align: 'left', sortable: true },
  { name: 'serie', label: 'Série', field: 'serie', align: 'left', sortable: true },
  { name: 'identificacao', label: 'Turma', field: 'identificacao', align: 'left', sortable: true },
  {
    name: 'turno',
    label: 'Turno',
    field: 'turno',
    align: 'left',
    sortable: true,
    format: (v) => turnoLabel(v),
  },
  { name: 'matriz', label: 'Matriz', field: 'matriz', align: 'left', format: (v) => v || '—' },
  {
    name: 'numero_alunos',
    label: 'Nº de alunos',
    field: 'numero_alunos',
    align: 'right',
    format: (v) => v ?? '—',
  },
]

const fields = [
  { name: 'ano_letivo', label: 'Ano letivo', type: 'number', required: true, default: anoSugerido },
  { name: 'serie', label: 'Série (ex.: 6º)', type: 'text', required: true },
  {
    name: 'identificacao',
    label: 'Identificação da turma (ex.: 1 ou A)',
    type: 'text',
    required: true,
  },
  { name: 'turno', label: 'Turno', type: 'select', required: true, options: opcoesTurno },
  { name: 'matriz', label: 'Matriz curricular', type: 'text' },
  { name: 'numero_alunos', label: 'Número de alunos', type: 'number' },
]
</script>
