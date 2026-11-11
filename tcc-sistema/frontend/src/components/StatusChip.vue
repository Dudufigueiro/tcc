<template>
  <q-chip
    dense
    square
    :color="config.color"
    :text-color="config.color === 'warning' ? 'dark' : 'white'"
    :icon="config.icon"
    :label="config.label"
    class="q-ma-none"
  />
</template>

<script setup>
import { computed } from 'vue'
import { SITUACAO_VAGA, STATUS_CADASTRO, STATUS_ESCOLHA } from '@/utils/format'

const props = defineProps({
  /** Valor do status (ex.: CONFIRMADA) */
  status: { type: String, required: true },
  /** Qual dicionário usar: escolha | cadastro | vaga */
  tipo: { type: String, default: 'escolha' },
})

const mapas = { escolha: STATUS_ESCOLHA, cadastro: STATUS_CADASTRO, vaga: SITUACAO_VAGA }

const config = computed(
  () => mapas[props.tipo]?.[props.status] ?? { label: props.status, color: 'grey-6', icon: 'help' },
)
</script>
