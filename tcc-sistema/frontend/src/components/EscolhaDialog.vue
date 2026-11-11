<template>
  <q-dialog v-model="aberto" persistent>
    <q-card style="width: 560px; max-width: 95vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ interesse ? 'Manifestar interesse' : 'Confirmar escolha' }}</div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" :disable="enviando" />
      </q-card-section>

      <q-card-section v-if="vaga">
        <div class="text-subtitle1 text-weight-medium">{{ vaga.disciplina_nome }}</div>
        <div class="text-muted">
          Turma {{ vaga.serie }} {{ vaga.identificacao }} · {{ turnoLabel(vaga.turno) }} ·
          {{ vaga.quantidade_aulas }} aula(s) semanais
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div v-if="carregando" class="row items-center q-gutter-sm text-muted">
          <q-spinner size="20px" color="primary" /> <span>Validando regras...</span>
        </div>

        <template v-else>
          <!-- Inconsistências que impedem o registro -->
          <q-banner v-if="impeditivos.length" rounded class="bg-red-1 text-negative">
            <template #avatar><q-icon name="error" /></template>
            <div class="text-weight-medium q-mb-xs">A escolha não pode ser confirmada:</div>
            <ul class="q-my-none q-pl-md">
              <li v-for="(e, i) in impeditivos" :key="i">{{ e.mensagem }}</li>
            </ul>
          </q-banner>

          <!-- Vaga ocupada: oferece manifestar interesse -->
          <q-banner
            v-else-if="!interesse && validacao?.permite_interesse"
            rounded
            class="bg-orange-1 text-orange-10"
          >
            <template #avatar><q-icon name="info" /></template>
            Esta vaga já
            {{ validacao.situacao_vaga === 'OCUPADA' ? 'foi preenchida' : 'está em disputa' }}. Você
            pode manifestar interesse: a decisão final é do gestor, com base nos critérios de
            prioridade.
          </q-banner>

          <!-- Tudo certo -->
          <q-banner v-else-if="validacao" rounded class="bg-green-1 text-positive">
            <template #avatar><q-icon name="check_circle" /></template>
            <template v-if="interesse">
              Nenhum conflito encontrado. Seu interesse ficará <b>em disputa</b> até a decisão do
              gestor.
            </template>
            <template v-else>
              Carga semanal após a escolha:
              <b
                >{{ validacao.carga.utilizada + validacao.carga.desta_vaga }} de
                {{ validacao.carga.regime }} aulas</b
              >.
            </template>
          </q-banner>

          <q-banner v-if="erroEnvio" rounded class="bg-red-1 text-negative q-mt-sm">{{
            erroEnvio
          }}</q-banner>
        </template>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn v-close-popup flat no-caps label="Cancelar" :disable="enviando" />
        <q-btn
          color="primary"
          unelevated
          no-caps
          :label="interesse ? 'Manifestar interesse' : 'Confirmar escolha'"
          :disable="carregando || impeditivos.length > 0 || !validacao"
          :loading="enviando"
          @click="confirmar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { escolhaService } from '@/services/escolha.service'
import { turnoLabel } from '@/utils/format'
import { notificarSucesso } from '@/utils/notify'

const props = defineProps({
  vaga: { type: Object, default: null },
  interesse: { type: Boolean, default: false },
})
const emit = defineEmits(['registrada'])
const aberto = defineModel({ type: Boolean, default: false })

const carregando = ref(false)
const enviando = ref(false)
const validacao = ref(null)
const erroEnvio = ref('')

// no modo "interesse" a indisponibilidade da vaga não impede o registro
const impeditivos = computed(() =>
  (validacao.value?.erros ?? []).filter(
    (e) => !(props.interesse && e.codigo === 'VAGA_INDISPONIVEL'),
  ),
)

// validação em tempo real: a cada abertura consulta as regras no servidor
watch(aberto, async (valor) => {
  if (!valor || !props.vaga) return
  validacao.value = null
  erroEnvio.value = ''
  carregando.value = true
  try {
    validacao.value = await escolhaService.validar({ vaga_id: props.vaga.id })
  } catch (e) {
    erroEnvio.value = e.mensagem
  } finally {
    carregando.value = false
  }
})

async function confirmar() {
  enviando.value = true
  erroEnvio.value = ''
  try {
    const escolha = await escolhaService.registrar({
      vaga_id: props.vaga.id,
      registrar_interesse: props.interesse,
    })
    notificarSucesso(
      escolha.status === 'CONFIRMADA'
        ? 'Escolha confirmada!'
        : 'Interesse registrado. Aguarde a decisão do gestor.',
    )
    aberto.value = false
    emit('registrada', escolha)
  } catch (e) {
    const erros = e.detalhes?.erros
    erroEnvio.value = erros?.length ? erros.map((x) => x.mensagem).join(' ') : e.mensagem
  } finally {
    enviando.value = false
  }
}
</script>
