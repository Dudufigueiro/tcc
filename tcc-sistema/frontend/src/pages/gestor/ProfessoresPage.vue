<template>
  <q-page class="page">
    <PageHeader
      title="Professores"
      subtitle="Validação de cadastros, regime de carga horária e dados de prioridade."
    >
      <q-btn
        color="primary"
        unelevated
        no-caps
        icon="person_add"
        label="Novo professor"
        @click="abrir('criar')"
      />
    </PageHeader>

    <div class="row items-center q-col-gutter-sm q-mb-md">
      <div class="col-12 col-sm-auto">
        <q-btn-toggle
          v-model="filtroStatus"
          unelevated
          no-caps
          toggle-color="primary"
          color="white"
          text-color="primary"
          :options="[
            { label: 'Todos', value: null },
            { label: 'Pendentes', value: 'PENDENTE' },
            { label: 'Aprovados', value: 'APROVADO' },
            { label: 'Rejeitados', value: 'REJEITADO' },
          ]"
        />
      </div>
      <div class="col-12 col-sm">
        <q-input
          v-model="busca"
          dense
          outlined
          clearable
          bg-color="white"
          placeholder="Buscar por nome, matrícula ou e-mail..."
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
    </div>

    <q-table
      flat
      class="card-flat"
      :rows="professores"
      :columns="columns"
      row-key="id"
      :filter="busca"
      :loading="carregando"
      :pagination="{ rowsPerPage: 15 }"
      no-data-label="Nenhum professor encontrado."
      rows-per-page-label="Linhas por página"
    >
      <template #body-cell-nome="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.row.nome }}</div>
          <div class="text-caption text-muted">{{ props.row.email }}</div>
        </q-td>
      </template>
      <template #body-cell-status_cadastro="props">
        <q-td :props="props">
          <StatusChip :status="props.row.status_cadastro" tipo="cadastro" />
          <q-chip
            v-if="!props.row.ativo"
            dense
            square
            color="grey-6"
            text-color="white"
            label="Inativo"
            class="q-ml-xs"
          />
        </q-td>
      </template>
      <template #body-cell-carga="props">
        <q-td :props="props">
          <template v-if="props.row.regime_carga_horaria"
            >{{ props.row.carga_utilizada }} / {{ props.row.regime_carga_horaria }}</template
          >
          <template v-else>—</template>
        </q-td>
      </template>
      <template #body-cell-acoes="props">
        <q-td :props="props" auto-width>
          <div class="acoes-linha">
            <!-- espaço reservado: mantém editar/excluir alinhados mesmo sem o botão Validar -->
            <div class="acoes-validar">
              <q-btn
                v-if="props.row.status_cadastro !== 'APROVADO'"
                color="secondary"
                unelevated
                no-caps
                dense
                icon="fact_check"
                label="Validar"
                class="q-px-sm"
                @click="abrir('validar', props.row)"
              />
            </div>
            <q-btn flat round dense icon="edit" color="primary" @click="abrir('editar', props.row)"
              ><q-tooltip>Editar</q-tooltip></q-btn
            >
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              @click="confirmarExclusao(props.row)"
              ><q-tooltip>Excluir cadastro</q-tooltip></q-btn
            >
          </div>
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo: criar / editar / validar -->
    <q-dialog v-model="dialogo.aberto" persistent>
      <q-card style="width: 560px; max-width: 95vw">
        <q-form @submit.prevent>
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">{{ tituloDialogo }}</div>
            <q-space />
            <q-btn v-close-popup flat round dense icon="close" />
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-banner v-if="erros.length" rounded class="bg-red-1 text-negative">
              <div v-for="(e, i) in erros" :key="i">{{ e }}</div>
            </q-banner>

            <template v-if="dialogo.modo === 'validar'">
              <div class="text-muted">
                <b>{{ dialogo.professor.nome }}</b> · matrícula {{ dialogo.professor.matricula }}.
                Defina o regime de carga horária para aprovar o cadastro.
              </div>
            </template>

            <template v-if="dialogo.modo !== 'validar'">
              <q-input
                v-model="form.nome"
                label="Nome completo *"
                outlined
                dense
                :rules="[obrigatorio]"
                lazy-rules="ondemand"
              />
              <q-input
                v-model="form.email"
                type="email"
                label="E-mail *"
                outlined
                dense
                :rules="[obrigatorio]"
                lazy-rules="ondemand"
              />
              <div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="form.matricula"
                      label="Matrícula *"
                      outlined
                      dense
                      :rules="[obrigatorio]"
                      lazy-rules="ondemand"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="form.senha"
                      type="password"
                      :label="dialogo.modo === 'criar' ? 'Senha inicial *' : 'Nova senha (opcional)'"
                      outlined
                      dense
                      autocomplete="new-password"
                      :rules="dialogo.modo === 'criar' ? [obrigatorio] : []"
                      lazy-rules="ondemand"
                    />
                  </div>
                </div>
              </div>
            </template>

            <div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.regime_carga_horaria"
                    type="number"
                    min="1"
                    :label="
                      dialogo.modo === 'editar' ? 'Regime (aulas/sem.)' : 'Regime (aulas/sem.) *'
                    "
                    outlined
                    dense
                    :rules="dialogo.modo === 'editar' ? [] : [obrigatorio]"
                    lazy-rules="ondemand"
                    hint="Ex.: 20 ou 40"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.classificacao"
                    type="number"
                    min="1"
                    label="Classificação"
                    outlined
                    dense
                    hint="1 = melhor"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.data_chegada_unidade"
                    type="date"
                    label="Chegada à unidade"
                    stack-label
                    outlined
                    dense
                  />
                </div>
              </div>
            </div>

            <q-toggle
              v-if="dialogo.modo === 'editar'"
              v-model="form.ativo"
              label="Usuário ativo (pode acessar o sistema)"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancelar" />
            <template v-if="dialogo.modo === 'validar'">
              <q-btn
                flat
                no-caps
                color="negative"
                icon="block"
                label="Rejeitar"
                :loading="salvando"
                @click="enviarValidacao('REJEITADO')"
              />
              <q-btn
                color="secondary"
                unelevated
                no-caps
                icon="verified"
                label="Aprovar cadastro"
                :loading="salvando"
                @click="enviarValidacao('APROVADO')"
              />
            </template>
            <q-btn
              v-else
              color="primary"
              unelevated
              no-caps
              label="Salvar"
              :loading="salvando"
              @click="enviarCadastro"
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
import StatusChip from '@/components/StatusChip.vue'
import { professorService } from '@/services/professor.service'
import { formatarData } from '@/utils/format'
import { notificarErro, notificarSucesso } from '@/utils/notify'

const $q = useQuasar()
const route = useRoute()
const professores = ref([])
const carregando = ref(false)
const busca = ref('')
const filtroStatus = ref(route.query.status ?? null)

const dialogo = reactive({ aberto: false, modo: 'criar', professor: null })
const form = reactive({})
const erros = ref([])
const salvando = ref(false)

const obrigatorio = (v) => (v !== null && v !== undefined && v !== '') || 'Campo obrigatório.'

const columns = [
  { name: 'nome', label: 'Professor', field: 'nome', align: 'left', sortable: true },
  { name: 'matricula', label: 'Matrícula', field: 'matricula', align: 'left', sortable: true },
  {
    name: 'status_cadastro',
    label: 'Cadastro',
    field: 'status_cadastro',
    align: 'left',
    sortable: true,
  },
  {
    name: 'regime',
    label: 'Regime',
    field: 'regime_carga_horaria',
    align: 'right',
    format: (v) => (v ? `${v} aulas` : '—'),
  },
  { name: 'carga', label: 'Carga escolhida', field: 'carga_utilizada', align: 'right' },
  {
    name: 'classificacao',
    label: 'Classif.',
    field: 'classificacao',
    align: 'right',
    format: (v) => v ?? '—',
  },
  {
    name: 'chegada',
    label: 'Chegada',
    field: 'data_chegada_unidade',
    align: 'left',
    format: formatarData,
    sortable: true,
  },
  { name: 'acoes', label: '', field: 'acoes', align: 'right' },
]

const tituloDialogo = computed(
  () =>
    ({ criar: 'Novo professor', editar: 'Editar professor', validar: 'Validar cadastro' })[
      dialogo.modo
    ],
)

async function carregar() {
  carregando.value = true
  try {
    professores.value = (
      await professorService.listar({ status: filtroStatus.value || undefined })
    ).professores
  } catch (e) {
    notificarErro(e)
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
watch(filtroStatus, carregar)

function abrir(modo, professor = null) {
  dialogo.modo = modo
  dialogo.professor = professor
  erros.value = []
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, {
    nome: professor?.nome ?? '',
    email: professor?.email ?? '',
    matricula: professor?.matricula ?? '',
    senha: '',
    regime_carga_horaria: professor?.regime_carga_horaria ?? null,
    classificacao: professor?.classificacao ?? null,
    data_chegada_unidade: professor?.data_chegada_unidade ?? '',
    ativo: professor?.ativo ?? true,
  })
  dialogo.aberto = true
}

const numeroOuNulo = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

function tratarErro(e) {
  erros.value = e.detalhes?.length
    ? e.detalhes.map((d) => `${d.campo}: ${d.mensagem}`)
    : [e.mensagem]
}

function confirmarExclusao(professor) {
  $q.dialog({
    title: 'Excluir cadastro',
    message: `Excluir o cadastro de ${professor.nome} (matrícula ${professor.matricula})? O usuário de acesso também será removido e esta ação não pode ser desfeita.`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Excluir', color: 'negative', unelevated: true, noCaps: true },
    persistent: true,
  }).onOk(async () => {
    try {
      await professorService.remover(professor.id)
      notificarSucesso('Cadastro excluído.')
      await carregar()
    } catch (e) {
      notificarErro(e)
    }
  })
}

async function enviarValidacao(status) {
  erros.value = []
  if (status === 'APROVADO' && !numeroOuNulo(form.regime_carga_horaria)) {
    erros.value = ['Informe o regime de carga horária para aprovar o cadastro.']
    return
  }
  salvando.value = true
  try {
    await professorService.validarCadastro(dialogo.professor.id, {
      status_cadastro: status,
      regime_carga_horaria: numeroOuNulo(form.regime_carga_horaria) ?? undefined,
      classificacao: numeroOuNulo(form.classificacao),
      data_chegada_unidade: form.data_chegada_unidade || null,
    })
    notificarSucesso(status === 'APROVADO' ? 'Cadastro aprovado.' : 'Cadastro rejeitado.')
    dialogo.aberto = false
    await carregar()
  } catch (e) {
    tratarErro(e)
  } finally {
    salvando.value = false
  }
}

async function enviarCadastro() {
  erros.value = []
  salvando.value = true
  try {
    const comum = {
      nome: form.nome.trim(),
      email: form.email.trim(),
      matricula: form.matricula.trim(),
      classificacao: numeroOuNulo(form.classificacao),
      data_chegada_unidade: form.data_chegada_unidade || null,
    }
    if (dialogo.modo === 'criar') {
      await professorService.criar({
        ...comum,
        senha: form.senha,
        regime_carga_horaria: numeroOuNulo(form.regime_carga_horaria),
      })
    } else {
      const regime = numeroOuNulo(form.regime_carga_horaria)
      await professorService.atualizar(dialogo.professor.id, {
        ...comum,
        ativo: form.ativo,
        ...(regime ? { regime_carga_horaria: regime } : {}),
        ...(form.senha ? { senha: form.senha } : {}),
      })
    }
    notificarSucesso('Professor salvo com sucesso.')
    dialogo.aberto = false
    await carregar()
  } catch (e) {
    tratarErro(e)
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.acoes-linha {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap;
  gap: 4px;
}

.acoes-validar {
  width: 100px;
  display: flex;
  justify-content: flex-end;
}
</style>
