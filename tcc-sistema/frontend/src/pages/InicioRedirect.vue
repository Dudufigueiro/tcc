<template>
  <q-page />
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

// Redireciona para a tela inicial do perfil logado
const router = useRouter()
const auth = useAuthStore()
onMounted(() => router.replace(auth.rotaInicial))
</script>
