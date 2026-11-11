<template>
  <q-page class="page">
    <PageHeader
      title="Escolhas e disputas"
      subtitle="Acompanhe as escolhas dos professores, decida disputas por vaga e faça ajustes quando necessário."
    >
      <AnoLetivoSelect v-model="ano" />
      <q-btn
        color="primary"
        unelevated
        no-caps
        icon="edit_note"
        label="Registrar em nome de professor"
        @click="abrirRegistro"
      />
    </PageHeader>

    <q-tabs
      v-model="aba"
      dense
      align="left"
      class="text-primary q-mb-md"
      active-color="primary"
      indicator-color="primary"
      no-caps
    >
      <q-tab name="escolhas" icon="list_alt" label="Escolhas" />
      <q-tab name="disputas" icon="balance">
        <template #default>
          <span class="q-tab__label">Disputas</span>
          <q-badge v-if="disputas.length" color="warning" text-color="dark" floating>{{
            disputas.length
          }}</q-badge>
        </template>
      </q-tab>
    </q-tabs>

    <q-tab-panels v-model="aba" animated class="bg-transparent">
      <!-- ===================== ESCOLHAS ===================== -->
      <q-tab-panel name="escolhas" class="q-pa-none">
        <div class="row items-center q-col-gutter-sm q-mb-md">
          <div class="col-12 col-sm-auto">
            <q-select
              v-model="filtros.status"
              :options="opcoesStatus"
              label="Status"
              dense
              outlined
              clearable
              emit-value
              map-options
              bg-color="white"
              style="min-width: 170px"
            />
          </div>
          <div class="col-12 col-sm-auto">
            <q-select
              v-model="filtros.professor_id"
              :options="opcoesProfessores"
              label="Professor"
              dense
              outlined
              clearable
              emit-value
              map-options
              bg-color="white"
              style="min-width: 240px"
            />
          </div>
          <div class="col-12 col-sm">
            <q-input
              v-model="busca"
              dense
              outlined
              clearable
              bg-color="white"
              placeholder="Buscar professor, disciplina ou turma..."
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
          </div>
        </div>

        <q-table
          flat
          class="card-flat"
          :rows="escolhas"
          :columns="columns"
          row-key="id"
          :filter="busca"
          :loading="carregando"
          :pagination="{ rowsPerPage: 15 }"
          no-data-label="Nenhuma escolha registrada."
          rows-per-page-label="Linhas por página"
        >
          <template #body-cell-professor_nome="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.professor_nome }}</div>
              <div class="text-caption text-muted">mat. {{ props.row.matricula }}</div>
            </q-td>
          </template>
          <template #body-cell-status="props">
            <q-td :props="props"><StatusChip :status="props.row.status" /></q-td>
          </template>
          <template #body-cell-acoes="props">
            <q-td :props="props" auto-width>
              <q-btn
                v-if="props.row.status === 'EM_DISPUTA'"
                color="secondary"
                unelevated
                no-caps
                dense
                icon="check"
                label="Confirmar"
                class="q-px-sm q-mr-xs"
                @click="confirmar(props.row)"
              />
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
      </q-tab-panel>

      <!-- ===================== DISPUTAS ===================== -->
      <q-tab-panel name="disputas" class="q-pa-none">
        <q-banner rounded class="bg-blue-1 text-primary q-mb-md">
          <template #avatar><q-icon name="info" /></template>
          Quando mais de um professor tem interesse na mesma vaga, os candidatos são
          <b>ordenados</b> pelos critérios ativos<span v-if="criteriosAtivos.length"
            >:
            {{
              criteriosAtivos
                .map((c, i) => `${i + 1}º ${c.descricao.split(' (')[0].toLowerCase()}`)
                .join(', ')
            }}</span
          >. O sistema apenas sinaliza a ordem — <b>a decisão final é sua</b>. Ao confirmar um
          candidato, quem ocupava a vaga é substituído.
        </q-banner>

        <div
          v-if="!disputas.length && !carregandoDisputas"
          class="card-flat q-pa-xl text-center text-muted"
        >
          <q-icon name="task_alt" size="48px" color="positive" />
          <div class="q-mt-sm">Nenhuma disputa pendente neste ano letivo.</div>
        </div>

        <div class="column q-gutter-md">
          <div v-for="d in disputas" :key="d.vaga.id" class="card-flat q-pa-md">
            <div class="row items-start q-col-gutter-sm q-mb-sm">
              <div class="col">
                <div class="text-subtitle1 text-weight-medium">{{ d.vaga.disciplina_nome }}</div>
                <div class="text-muted">
                  Turma {{ d.vaga.turma }} · {{ turnoLabel(d.vaga.turno) }} ·
                  {{ d.vaga.quantidade_aulas }} aulas
                </div>
              </div>
            </div>

            <q-list separator bordered class="rounded-borders">
              <q-item
                v-for="c in d.candidatos"
                :key="c.escolha_id"
                :class="{ 'bg-green-1': c.atual }"
              >
                <q-item-section avatar>
                  <q-avatar
                    size="34px"
                    :color="c.posicao === 1 ? 'primary' : 'grey-4'"
                    :text-color="c.posicao === 1 ? 'white' : 'dark'"
                    >{{ c.posicao }}º</q-avatar
                  >
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ c.professor_nome }}
                    <q-chip
                      v-if="c.atual"
                      dense
                      square
                      color="positive"
                      text-color="white"
                      icon="push_pin"
                      label="Ocupa a vaga"
                      class="q-ml-sm"
                    />
                    <q-chip
                      v-else
                      dense
                      square
                      color="warning"
                      text-color="dark"
                      icon="hourglass_top"
                      label="Interesse"
                      class="q-ml-sm"
                    />
                  </q-item-label>
                  <q-item-label caption>
                    mat. {{ c.matricula }} · classificação {{ c.classificacao ?? '—' }} · na unidade
                    desde {{ formatarData(c.data_chegada_unidade) }} · registrou em
                    {{ formatarDataHora(c.data_registro) }}
                  </q-item-label>
                  <q-item-label v-for="(e, i) in c.erros" :key="i" caption class="text-negative"
                    >⚠ {{ e.mensagem }}</q-item-label
                  >
                </q-item-section>
                <q-item-section side>
                  <div class="row q-gutter-xs">
                    <q-btn
                      v-if="!c.atual"
                      color="secondary"
                      unelevated
                      no-caps
                      dense
                      icon="check"
                      :label="d.candidatos.some((x) => x.atual) ? 'Substituir' : 'Confirmar'"
                      class="q-px-sm"
                      :disable="!c.pode_confirmar"
                      @click="
                        confirmar(
                          {
                            id: c.escolha_id,
                            professor_nome: c.professor_nome,
                            disciplina_nome: d.vaga.disciplina_nome,
                            serie: d.vaga.turma,
                            identificacao: '',
                          },
                          d,
                        )
                      "
                    />
                    <q-btn
                      flat
                      no-caps
                      dense
                      color="negative"
                      icon="cancel"
                      :label="c.atual ? 'Cancelar escolha' : 'Descartar'"
                      @click="
                        cancelar({
                          id: c.escolha_id,
                          professor_nome: c.professor_nome,
                          disciplina_nome: d.vaga.disciplina_nome,
                          serie: d.vaga.turma,
                          identificacao: '',
                        })
                      "
                    />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Registrar em nome de um professor -->
    <q-dialog v-model="registro.aberto" persistent>
      <q-card style="width: 560px; max-width: 95vw">
        <q-form @submit.prevent="registrarEmNome">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">Registrar escolha em nome do professor</div>
            <q-space />
            <q-btn v-close-popup flat round dense icon="close" />
          </q-card-section>
          <q-card-section class="q-gutter-md">
            <q-banner v-if="registro.erros.length" rounded class="bg-red-1 text-negative">
              <div v-for="(e, i) in registro.erros" :key="i">{{ e }}</div>
            </q-banner>
            <q-select
              v-model="registro.professor_id"
              :options="opcoesProfessoresAprovados"
              label="Professor *"
              outlined
              dense
              emit-value
              map-options
              :rules="[(v) => !!v || 'Selecione o professor.']"
              lazy-rules="ondemand"
            />
            <q-select
              v-model="registro.vaga_id"
              :options="opcoesVagas"
              label="Vaga *"
              outlined
              dense
              emit-value
              map-options
              use-input
              input-debounce="0"
              @filter="filtrarVagas"
              :rules="[(v) => !!v || 'Selecione a vaga.']"
              lazy-rules="ondemand"
            />
            <q-toggle
              v-model="registro.interesse"
              label="Se a vaga estiver ocupada, registrar como interesse (disputa)"
            />
            <div class="text-caption text-muted">
              As mesmas regras de validação (conflito, carga e vaga) valem para o registro feito
              pelo gestor.
            </div>
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancelar" />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              label="Registrar"
              :loading="registro.enviando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from '@/components/PageHeader.vue'
import AnoLetivoSelect from '@/components/AnoLetivoSelect.vue'
import StatusChip from '@/components/StatusChip.vue'
import { escolhaService } from '@/services/escolha.service'
import { professorService } from '@/services/professor.service'
import { criterioService, vagaService } from '@/services/cadastros.service'
import { formatarData, formatarDataHora, turnoLabel } from '@/utils/format'
import { notificarErro, notificarSucesso } from '@/utils/notify'

const $q = useQuasar()
const route = useRoute()

const ano = ref(null)
const aba = ref(route.query.aba === 'disputas' ? 'disputas' : 'escolhas')
// o menu lateral e o painel navegam para a mesma rota mudando só a query: mantém a aba em sincronia
watch(
  () => route.query.aba,
  (valor) => {
    aba.value = valor === 'disputas' ? 'disputas' : 'escolhas'
  },
)
const busca = ref('')
const filtros = reactive({ status: null, professor_id: null })

const escolhas = ref([])
const disputas = ref([])
const professores = ref([])
const vagas = ref([])
const criterios = ref([])
const carregando = ref(false)
const carregandoDisputas = ref(false)

const opcoesStatus = [
  { value: 'CONFIRMADA', label: 'Confirmadas' },
  { value: 'EM_DISPUTA', label: 'Em disputa' },
  { value: 'CANCELADA', label: 'Canceladas' },
]
const opcoesProfessores = computed(() =>
  professores.value.map((p) => ({ value: p.id, label: p.nome })),
)
const opcoesProfessoresAprovados = computed(() =>
  professores.value
    .filter((p) => p.status_cadastro === 'APROVADO')
    .map((p) => ({ value: p.id, label: `${p.nome} (mat. ${p.matricula})` })),
)
const criteriosAtivos = computed(() => criterios.value.filter((c) => c.ativo))

const columns = [
  {
    name: 'professor_nome',
    label: 'Professor',
    field: 'professor_nome',
    align: 'left',
    sortable: true,
  },
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
  { name: 'status', label: 'Status', field: 'status', align: 'left', sortable: true },
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
  carregando.value = true
  try {
    const dados = await escolhaService.listar({
      ano_letivo: ano.value || undefined,
      status: filtros.status || undefined,
      professor_id: filtros.professor_id || undefined,
    })
    escolhas.value = dados.escolhas
  } catch (e) {
    notificarErro(e)
  } finally {
    carregando.value = false
  }
}

async function carregarDisputas() {
  carregandoDisputas.value = true
  try {
    disputas.value = (
      await escolhaService.disputas({ ano_letivo: ano.value || undefined })
    ).disputas
  } catch (e) {
    notificarErro(e)
  } finally {
    carregandoDisputas.value = false
  }
}

const recarregar = () => Promise.all([carregarEscolhas(), carregarDisputas()])

onMounted(async () => {
  try {
    ;[professores.value, criterios.value] = await Promise.all([
      professorService.listar().then((r) => r.professores),
      criterioService.listar(),
    ])
  } catch (e) {
    notificarErro(e)
  }
})
watch(ano, async () => {
  await recarregar()
  if (ano.value) vagas.value = await vagaService.listar({ ano_letivo: ano.value }).catch(() => [])
})
watch(() => [filtros.status, filtros.professor_id], carregarEscolhas)

// ---------- ações ----------
function confirmar(escolha, disputa = null) {
  const substitui =
    disputa?.candidatos.find((c) => c.atual) ?? (escolha.vaga_situacao === 'OCUPADA' ? true : null)
  $q.dialog({
    title: 'Confirmar escolha',
    message:
      `Confirmar ${escolha.professor_nome} em ${escolha.disciplina_nome}?` +
      (substitui && substitui !== true
        ? ` ${substitui.professor_nome} deixará de ocupar esta vaga.`
        : ''),
    persistent: true,
    cancel: { label: 'Voltar', flat: true, noCaps: true },
    ok: { label: 'Confirmar', color: 'secondary', unelevated: true, noCaps: true },
  }).onOk(async () => {
    try {
      await escolhaService.confirmar(escolha.id)
      notificarSucesso('Escolha confirmada.')
      await recarregar()
    } catch (e) {
      notificarErro(
        e.detalhes?.erros?.length ? e.detalhes.erros.map((x) => x.mensagem).join(' ') : e,
      )
    }
  })
}

function cancelar(escolha) {
  $q.dialog({
    title: 'Cancelar escolha',
    message: `Cancelar a escolha de ${escolha.professor_nome} em ${escolha.disciplina_nome}? Informe o motivo (opcional):`,
    prompt: { model: '', type: 'text', outlined: true, dense: true },
    persistent: true,
    cancel: { label: 'Voltar', flat: true, noCaps: true },
    ok: { label: 'Cancelar escolha', color: 'negative', unelevated: true, noCaps: true },
  }).onOk(async (motivo) => {
    try {
      await escolhaService.cancelar(escolha.id, motivo || undefined)
      notificarSucesso('Escolha cancelada.')
      await recarregar()
    } catch (e) {
      notificarErro(e)
    }
  })
}

// ---------- registrar em nome do professor ----------
const registro = reactive({
  aberto: false,
  professor_id: null,
  vaga_id: null,
  interesse: false,
  erros: [],
  enviando: false,
})
const filtroVagas = ref('')

const opcoesVagas = computed(() => {
  const termo = filtroVagas.value.toLowerCase()
  return vagas.value
    .map((v) => ({
      value: v.id,
      label: `${v.disciplina_nome} · ${v.serie} ${v.identificacao} · ${turnoLabel(v.turno)} · ${v.quantidade_aulas} aulas · ${{ LIVRE: 'livre', OCUPADA: 'ocupada', EM_DISPUTA: 'em disputa' }[v.situacao]}`,
    }))
    .filter((o) => o.label.toLowerCase().includes(termo))
})

function filtrarVagas(valor, update) {
  update(() => {
    filtroVagas.value = valor
  })
}

function abrirRegistro() {
  Object.assign(registro, {
    aberto: true,
    professor_id: null,
    vaga_id: null,
    interesse: false,
    erros: [],
  })
  filtroVagas.value = ''
}

async function registrarEmNome() {
  registro.enviando = true
  registro.erros = []
  try {
    const escolha = await escolhaService.registrar({
      vaga_id: registro.vaga_id,
      professor_id: registro.professor_id,
      registrar_interesse: registro.interesse,
    })
    notificarSucesso(
      escolha.status === 'CONFIRMADA'
        ? 'Escolha registrada e confirmada.'
        : 'Interesse registrado (em disputa).',
    )
    registro.aberto = false
    vagas.value = await vagaService.listar({ ano_letivo: ano.value })
    await recarregar()
  } catch (e) {
    registro.erros = e.detalhes?.erros?.length
      ? e.detalhes.erros.map((x) => x.mensagem)
      : [e.mensagem]
    if (e.detalhes?.permite_interesse)
      registro.erros.push('Ative a opção de registrar como interesse para entrar na disputa.')
  } finally {
    registro.enviando = false
  }
}
</script>
