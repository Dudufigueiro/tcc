<template>
  <div>
    <!-- Barra: busca + filtros extras (slot "toolbar") + botão novo -->
    <div class="row items-center q-col-gutter-sm q-mb-md no-print">
      <div class="col-12 col-sm">
        <q-input
          v-model="busca"
          dense
          outlined
          clearable
          debounce="200"
          bg-color="white"
          placeholder="Buscar..."
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
      <div class="col-12 col-sm-auto row items-center q-gutter-sm">
        <slot name="toolbar" />
        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="add"
          :label="novoLabel"
          @click="abrirNovo"
        />
      </div>
    </div>

    <q-table
      flat
      class="card-flat"
      :rows="linhas"
      :columns="colunasTabela"
      :row-key="rowKey"
      :filter="busca"
      :loading="carregando"
      :pagination="{ rowsPerPage: 15 }"
      :rows-per-page-options="[15, 30, 50, 0]"
      no-data-label="Nenhum registro encontrado."
      loading-label="Carregando..."
      rows-per-page-label="Linhas por página"
    >
      <!-- repassa slots body-cell-* da página para a tabela -->
      <template v-for="nome in slotsDaTabela" :key="nome" #[nome]="scope">
        <slot :name="nome" v-bind="scope" />
      </template>

      <template #body-cell-acoes="props">
        <q-td :props="props" auto-width class="no-print">
          <slot name="acoes-extra" :row="props.row" />
          <q-btn flat round dense icon="edit" color="primary" @click="abrirEdicao(props.row)">
            <q-tooltip>Editar</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="delete"
            color="negative"
            @click="confirmarExclusao(props.row)"
          >
            <q-tooltip>Excluir</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Formulário de criação / edição -->
    <q-dialog v-model="dialogo" persistent>
      <q-card style="width: 540px; max-width: 95vw">
        <q-form @submit.prevent="salvar">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">{{ editando ? 'Editar registro' : novoLabel }}</div>
            <q-space />
            <q-btn v-close-popup flat round dense icon="close" />
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-banner v-if="errosForm.length" rounded class="bg-red-1 text-negative">
              <div v-for="(e, i) in errosForm" :key="i">{{ e }}</div>
            </q-banner>

            <template v-for="campo in campos" :key="campo.name">
              <template v-if="!campo.show || campo.show(form)">
                <q-toggle
                  v-if="campo.type === 'toggle'"
                  v-model="form[campo.name]"
                  :label="campo.label"
                />

                <q-select
                  v-else-if="campo.type === 'select' || campo.type === 'multiselect'"
                  v-model="form[campo.name]"
                  :label="rotulo(campo)"
                  :options="opcoes(campo)"
                  :multiple="campo.type === 'multiselect'"
                  :use-chips="campo.type === 'multiselect'"
                  :hint="dica(campo)"
                  :disable="campo.disabledOnEdit && !!editando"
                  :rules="regras(campo)"
                  emit-value
                  map-options
                  outlined
                  dense
                  lazy-rules="ondemand"
                  @update:model-value="(v) => campo.onChange && campo.onChange(v, form)"
                />

                <q-input
                  v-else
                  v-model="form[campo.name]"
                  :label="rotulo(campo)"
                  :type="campo.type || 'text'"
                  :hint="dica(campo)"
                  :disable="campo.disabledOnEdit && !!editando"
                  :rules="regras(campo)"
                  outlined
                  dense
                  lazy-rules="ondemand"
                />
              </template>
            </template>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancelar" />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              label="Salvar"
              :loading="salvando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, useSlots, watch } from 'vue'
import { useQuasar } from 'quasar'
import { notificarErro, notificarSucesso } from '@/utils/notify'

/**
 * Tabela CRUD genérica usada nas telas de dados-base.
 *
 * campos: [{ name, label, type: 'text'|'number'|'time'|'toggle'|'select'|'multiselect',
 *            required, default, options (lista ou fn(form)), hint (texto ou fn(form)), onChange(valor, form),
 *            rules: [(valor, form) => true | 'mensagem'], show: fn(form), disabledOnEdit }]
 */
const props = defineProps({
  service: { type: Object, required: true }, // { listar, criar, atualizar, remover }
  columns: { type: Array, required: true },
  fields: { type: Array, required: true },
  params: { type: Object, default: () => ({}) }, // filtros enviados ao listar
  rowKey: { type: String, default: 'id' },
  novoLabel: { type: String, default: 'Novo registro' },
  toForm: { type: Function, default: null }, // registro -> valores do formulário
  toPayload: { type: Function, default: null }, // formulário -> corpo da requisição
})

const $q = useQuasar()
const slots = useSlots()

const linhas = ref([])
const carregando = ref(false)
const busca = ref('')

const dialogo = ref(false)
const editando = ref(null)
const salvando = ref(false)
const errosForm = ref([])
const form = reactive({})

const campos = computed(() => props.fields)
const colunasTabela = computed(() => [
  ...props.columns,
  { name: 'acoes', label: '', field: 'acoes', align: 'right' },
])
const slotsDaTabela = computed(() =>
  Object.keys(slots).filter((n) => n.startsWith('body-cell-') && n !== 'body-cell-acoes'),
)

async function carregar() {
  carregando.value = true
  try {
    linhas.value = await props.service.listar(props.params)
  } catch (e) {
    notificarErro(e)
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
watch(() => props.params, carregar, { deep: true })

// ---------- formulário ----------
const vazio = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)

function valoresIniciais() {
  const valores = {}
  for (const c of props.fields) {
    if (c.default !== undefined)
      valores[c.name] = typeof c.default === 'function' ? c.default() : c.default
    else if (c.type === 'toggle') valores[c.name] = true
    else if (c.type === 'multiselect') valores[c.name] = []
    else valores[c.name] = null
  }
  return valores
}

function preencher(valores) {
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, valores)
  errosForm.value = []
}

function abrirNovo() {
  editando.value = null
  preencher(valoresIniciais())
  dialogo.value = true
}

function abrirEdicao(row) {
  editando.value = row
  const base = props.toForm
    ? props.toForm(row)
    : Object.fromEntries(props.fields.map((c) => [c.name, row[c.name] ?? null]))
  preencher({ ...valoresIniciais(), ...base })
  dialogo.value = true
}

const rotulo = (c) => (c.required ? `${c.label} *` : c.label)
const dica = (c) => (typeof c.hint === 'function' ? c.hint(form) : c.hint)
const opcoes = (c) => (typeof c.options === 'function' ? c.options(form) : (c.options ?? []))

function regras(c) {
  const lista = []
  if (c.required) lista.push((v) => !vazio(v) || 'Campo obrigatório.')
  for (const r of c.rules ?? []) lista.push((v) => r(v, form))
  return lista
}

function montarPayload() {
  if (props.toPayload) return props.toPayload({ ...form })
  const payload = {}
  for (const c of props.fields) {
    let valor = form[c.name]
    if (c.type === 'number') valor = vazio(valor) ? null : Number(valor)
    else if (typeof valor === 'string') valor = valor.trim() === '' ? null : valor.trim()
    payload[c.name] = valor
  }
  return payload
}

async function salvar() {
  salvando.value = true
  errosForm.value = []
  try {
    const payload = montarPayload()
    if (editando.value) await props.service.atualizar(editando.value[props.rowKey], payload)
    else await props.service.criar(payload)
    notificarSucesso('Registro salvo com sucesso.')
    dialogo.value = false
    await carregar()
  } catch (e) {
    errosForm.value = e.detalhes?.length
      ? e.detalhes.map((d) => (d.campo ? `${d.campo}: ${d.mensagem}` : d.mensagem))
      : [e.mensagem]
  } finally {
    salvando.value = false
  }
}

function confirmarExclusao(row) {
  $q.dialog({
    title: 'Excluir registro',
    message: 'Tem certeza de que deseja excluir este registro? Esta ação não pode ser desfeita.',
    persistent: true,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Excluir', color: 'negative', unelevated: true, noCaps: true },
  }).onOk(async () => {
    try {
      await props.service.remover(row[props.rowKey])
      notificarSucesso('Registro excluído.')
      await carregar()
    } catch (e) {
      notificarErro(e)
    }
  })
}

defineExpose({ recarregar: carregar })
</script>
