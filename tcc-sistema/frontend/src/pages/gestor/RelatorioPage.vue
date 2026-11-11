<template>
  <q-page class="page">
    <PageHeader
      title="Relatório consolidado"
      subtitle="Escolhas confirmadas do ano letivo, para apoiar o lançamento manual no SISGESC."
    >
      <AnoLetivoSelect v-model="ano" />
      <q-btn
        outline
        color="primary"
        no-caps
        icon="print"
        label="Imprimir"
        :disable="!relatorio"
        @click="imprimir"
      />
      <q-btn
        color="primary"
        unelevated
        no-caps
        icon="download"
        label="Baixar CSV"
        :disable="!relatorio"
        :loading="baixando"
        @click="baixar"
      />
    </PageHeader>

    <q-inner-loading :showing="carregando" />

    <div v-if="!relatorio && !carregando" class="card-flat q-pa-xl text-center text-muted">
      Nenhuma vaga cadastrada para gerar o relatório.
    </div>

    <template v-if="relatorio">
      <div class="text-muted q-mb-md">
        Ano letivo <b>{{ relatorio.ano_letivo }}</b> · gerado em
        {{ formatarDataHora(relatorio.gerado_em) }}
      </div>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6 col-md-3">
          <div class="card-flat stat-card">
            <div class="stat-label">Vagas preenchidas</div>
            <div class="stat-value">
              {{ relatorio.resumo.vagas_preenchidas
              }}<span class="text-muted text-h6"> / {{ relatorio.resumo.vagas_total }}</span>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card-flat stat-card">
            <div class="stat-label">Aulas atribuídas</div>
            <div class="stat-value">
              {{ relatorio.resumo.aulas_atribuidas
              }}<span class="text-muted text-h6"> / {{ relatorio.resumo.aulas_total }}</span>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card-flat stat-card">
            <div class="stat-label">Vagas livres</div>
            <div class="stat-value">{{ relatorio.resumo.vagas_livres }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card-flat stat-card">
            <div class="stat-label">Em disputa</div>
            <div class="stat-value">{{ relatorio.resumo.vagas_em_disputa }}</div>
            <div v-if="relatorio.resumo.vagas_em_disputa" class="stat-hint text-warning">
              pendentes de decisão do gestor
            </div>
          </div>
        </div>
      </div>

      <h2 class="section-title">Por professor</h2>
      <q-table
        flat
        class="card-flat q-mb-lg"
        :rows="relatorio.professores"
        :columns="colunasProfessores"
        row-key="matricula"
        hide-bottom
        :pagination="{ rowsPerPage: 0 }"
        no-data-label="Nenhuma escolha confirmada ainda."
      >
        <template #body-cell-vagas="props">
          <q-td :props="props" class="cell-wrap">
            <div v-for="v in props.row.vagas" :key="v.vaga_id" class="text-body2">
              {{ v.disciplina_nome }} · {{ v.serie }} {{ v.turma }} ({{ turnoLabel(v.turno) }}) ·
              {{ v.quantidade_aulas }} aulas
            </div>
          </q-td>
        </template>
      </q-table>

      <h2 class="section-title">Distribuição de aulas por disciplina e turma</h2>
      <q-table
        flat
        class="card-flat"
        :rows="relatorio.linhas"
        :columns="colunasLinhas"
        row-key="vaga_id"
        :pagination="{ rowsPerPage: 0 }"
        hide-bottom
      >
        <template #body-cell-situacao="props">
          <q-td :props="props"><StatusChip :status="props.row.situacao" tipo="vaga" /></q-td>
        </template>
      </q-table>
    </template>
  </q-page>
</template>

<script setup>
import { ref, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import AnoLetivoSelect from '@/components/AnoLetivoSelect.vue'
import StatusChip from '@/components/StatusChip.vue'
import { relatorioService } from '@/services/gestao.service'
import { formatarDataHora, turnoLabel } from '@/utils/format'
import { notificarErro } from '@/utils/notify'

const ano = ref(null)
const relatorio = ref(null)
const carregando = ref(false)
const baixando = ref(false)

const colunasProfessores = [
  { name: 'nome', label: 'Professor', field: 'nome', align: 'left', sortable: true },
  { name: 'matricula', label: 'Matrícula', field: 'matricula', align: 'left' },
  {
    name: 'regime',
    label: 'Regime',
    field: 'regime',
    align: 'right',
    format: (v) => (v ? `${v} aulas` : '—'),
  },
  { name: 'total_aulas', label: 'Aulas escolhidas', field: 'total_aulas', align: 'right' },
  { name: 'saldo', label: 'Saldo', field: 'saldo', align: 'right', format: (v) => `${v} aula(s)` },
  { name: 'vagas', label: 'Vagas', field: 'vagas', align: 'left' },
]

const colunasLinhas = [
  {
    name: 'disciplina',
    label: 'Disciplina',
    field: (r) => `${r.disciplina_nome} (${r.disciplina_codigo})`,
    align: 'left',
    sortable: true,
  },
  {
    name: 'turma',
    label: 'Série / turma',
    field: (r) => `${r.serie} ${r.turma}`,
    align: 'left',
    sortable: true,
  },
  { name: 'turno', label: 'Turno', field: 'turno', align: 'left', format: (v) => turnoLabel(v) },
  { name: 'matriz', label: 'Matriz', field: 'matriz', align: 'left', format: (v) => v || '—' },
  { name: 'aulas', label: 'Aulas', field: 'quantidade_aulas', align: 'right' },
  { name: 'tipo', label: 'Tipo de vaga', field: 'tipo_vaga', align: 'left' },
  { name: 'situacao', label: 'Situação', field: 'situacao', align: 'left' },
  {
    name: 'professor',
    label: 'Professor',
    field: 'professor_nome',
    align: 'left',
    format: (v) => v || '—',
  },
  {
    name: 'prof_matricula',
    label: 'Matrícula',
    field: 'professor_matricula',
    align: 'left',
    format: (v) => v || '—',
  },
]

async function carregar() {
  carregando.value = true
  try {
    const dados = await relatorioService.consolidado({ ano_letivo: ano.value || undefined })
    relatorio.value = dados.linhas.length ? dados : null
  } catch (e) {
    notificarErro(e)
  } finally {
    carregando.value = false
  }
}

async function baixar() {
  baixando.value = true
  try {
    await relatorioService.baixarCsv({ ano_letivo: relatorio.value.ano_letivo })
  } catch (e) {
    notificarErro(e)
  } finally {
    baixando.value = false
  }
}

const imprimir = () => window.print()

watch(ano, carregar)
</script>
