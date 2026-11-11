<template>
  <div class="card-flat q-pa-md">
    <div class="row items-center q-col-gutter-md">
      <div class="col-12 col-md-4">
        <div class="text-muted text-caption text-uppercase">Sua carga horária</div>
        <div class="text-h5 text-weight-medium">
          {{ resumo.carga_utilizada }}
          <span class="text-muted text-subtitle1"
            >de {{ resumo.regime_carga_horaria ?? '—' }} aulas</span
          >
        </div>
      </div>
      <div class="col-12 col-md">
        <q-linear-progress
          :value="percentual"
          size="14px"
          rounded
          :color="percentual >= 1 ? 'warning' : 'secondary'"
          track-color="grey-3"
        />
        <div class="text-caption text-muted q-mt-xs">
          <template v-if="resumo.status_cadastro === 'APROVADO'">
            {{ resumo.carga_disponivel }} aula(s) ainda disponível(is) · ano letivo
            {{ resumo.ano_letivo ?? '—' }}
          </template>
          <template v-else>Regime de carga horária ainda não definido pelo gestor.</template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  resumo: { type: Object, required: true },
})

const percentual = computed(() => {
  const regime = props.resumo.regime_carga_horaria
  return regime ? Math.min(props.resumo.carga_utilizada / regime, 1) : 0
})
</script>
