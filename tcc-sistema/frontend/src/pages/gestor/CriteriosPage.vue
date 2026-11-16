<template>
  <q-page class="page">
    <PageHeader
      title="Critérios de prioridade"
      subtitle="Usados para organizar os professores quando há interesse na mesma vaga."
    />

    <q-banner rounded class="bg-grey-2 text-primary q-mb-md">
      Os critérios <b>ativos</b> são aplicados na ordem indicada (1 = primeiro). Em caso de empate
      no primeiro critério, vale o segundo, e assim por diante. O sistema apenas
      <b>organiza e sinaliza</b> a ordem: a decisão final é sempre do gestor.
    </q-banner>

    <CrudTable
      :service="criterioService"
      :columns="columns"
      :fields="fields"
      novo-label="Novo critério"
    >
      <template #body-cell-ativo="props">
        <q-td :props="props">
          <q-icon
            :name="props.row.ativo ? 'check_circle' : 'remove_circle_outline'"
            :color="props.row.ativo ? 'positive' : 'grey-6'"
            size="sm"
          />
        </q-td>
      </template>
    </CrudTable>
  </q-page>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'
import CrudTable from '@/components/CrudTable.vue'
import { criterioService } from '@/services/cadastros.service'
import { opcoesTipoCriterio } from '@/utils/format'

const rotuloTipo = (v) => opcoesTipoCriterio.find((o) => o.value === v)?.label ?? v

const columns = [
  { name: 'ordem', label: 'Ordem', field: 'ordem', align: 'left', sortable: true },
  {
    name: 'descricao',
    label: 'Descrição',
    field: 'descricao',
    align: 'left',
    classes: 'cell-wrap',
  },
  {
    name: 'tipo',
    label: 'Tipo',
    field: 'tipo',
    align: 'left',
    format: rotuloTipo,
    classes: 'cell-wrap',
  },
  { name: 'ativo', label: 'Ativo', field: 'ativo', align: 'center' },
]

const fields = [
  { name: 'descricao', label: 'Descrição', type: 'text', required: true },
  {
    name: 'tipo',
    label: 'Tipo de critério',
    type: 'select',
    required: true,
    options: opcoesTipoCriterio,
    disabledOnEdit: true,
  },
  { name: 'ordem', label: 'Ordem de aplicação', type: 'number', required: true, default: 1 },
  { name: 'ativo', label: 'Critério ativo', type: 'toggle', default: true },
]
</script>
