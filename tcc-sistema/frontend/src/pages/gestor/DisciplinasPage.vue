<template>
  <q-page class="page">
    <PageHeader
      title="Disciplinas"
      subtitle="Disciplinas ofertadas pela escola (usadas na criação das vagas)."
    />
    <CrudTable
      :service="disciplinaService"
      :columns="columns"
      :fields="fields"
      novo-label="Nova disciplina"
    />
  </q-page>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'
import CrudTable from '@/components/CrudTable.vue'
import { disciplinaService } from '@/services/cadastros.service'

const columns = [
  { name: 'codigo', label: 'Código', field: 'codigo', align: 'left', sortable: true },
  { name: 'nome', label: 'Nome', field: 'nome', align: 'left', sortable: true },
  {
    name: 'area',
    label: 'Área',
    field: 'area',
    align: 'left',
    sortable: true,
    format: (v) => v || '—',
  },
]

const fields = [
  { name: 'codigo', label: 'Código', type: 'text', required: true },
  { name: 'nome', label: 'Nome da disciplina', type: 'text', required: true },
  { name: 'area', label: 'Área de conhecimento', type: 'text' },
]
</script>
