<template>
  <q-select
    v-model="modelo"
    :options="anos"
    label="Ano letivo"
    dense
    outlined
    bg-color="white"
    options-dense
    style="min-width: 140px"
    :disable="!anos.length"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { vagaService } from '@/services/cadastros.service'

/** Seletor do ano letivo. Se nenhum valor for informado, assume o ano mais recente cadastrado. */
const modelo = defineModel({ type: Number, default: null })
const anos = ref([])

onMounted(async () => {
  try {
    anos.value = await vagaService.anosLetivos()
    if (modelo.value == null && anos.value.length) modelo.value = anos.value[0]
  } catch {
    anos.value = []
  }
})
</script>
