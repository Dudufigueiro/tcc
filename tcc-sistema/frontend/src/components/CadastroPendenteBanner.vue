<template>
  <q-banner v-if="status && status !== 'APROVADO'" rounded class="q-mb-md" :class="classe">
    <template #avatar
      ><q-icon :name="status === 'PENDENTE' ? 'hourglass_top' : 'block'"
    /></template>
    <template v-if="status === 'PENDENTE'">
      <b>Cadastro aguardando validação.</b> O gestor escolar precisa validar seus dados e definir o
      seu regime de carga horária antes de você registrar escolhas. Você já pode consultar as vagas.
    </template>
    <template v-else>
      <b>Cadastro rejeitado.</b> Procure a gestão escolar para regularizar sua situação.
    </template>
  </q-banner>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: null },
})

const classe = computed(() =>
  props.status === 'PENDENTE' ? 'bg-orange-1 text-orange-10' : 'bg-red-1 text-negative',
)
</script>
