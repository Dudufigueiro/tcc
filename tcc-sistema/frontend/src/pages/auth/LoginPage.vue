<template>
  <div>
    <h2 class="text-h5 text-weight-medium text-center q-mt-none q-mb-lg text-primary">Entrar</h2>

    <q-banner v-if="$route.query.expirou" rounded class="bg-orange-1 text-orange-10 q-mb-md">
      Sua sessão expirou. Faça login novamente.
    </q-banner>

    <q-form class="q-gutter-md" @submit.prevent="entrar">
      <q-input
        v-model="email"
        type="email"
        label="E-mail"
        outlined
        autofocus
        autocomplete="username"
        :rules="[(v) => !!v || 'Informe o e-mail.']"
        lazy-rules="ondemand"
      >
        <template #prepend><q-icon name="mail" /></template>
      </q-input>

      <q-input
        v-model="senha"
        :type="mostrarSenha ? 'text' : 'password'"
        label="Senha"
        outlined
        autocomplete="current-password"
        :rules="[(v) => !!v || 'Informe a senha.']"
        lazy-rules="ondemand"
      >
        <template #prepend><q-icon name="lock" /></template>
        <template #append>
          <q-icon
            :name="mostrarSenha ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="mostrarSenha = !mostrarSenha"
          />
        </template>
      </q-input>

      <q-btn
        type="submit"
        color="primary"
        unelevated
        no-caps
        size="lg"
        class="full-width"
        label="Entrar"
        :loading="carregando"
      />
    </q-form>

    <div class="q-mt-lg text-center text-muted">
      Professor e ainda não tem acesso?
      <router-link to="/cadastro" class="text-primary text-weight-medium"
        >Solicitar cadastro</router-link
      >
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'
import { notificarErro } from '@/utils/notify'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const carregando = ref(false)

async function entrar() {
  carregando.value = true
  try {
    await auth.login(email.value.trim(), senha.value)
    router.push(route.query.redirect || auth.rotaInicial)
  } catch (e) {
    notificarErro(e)
  } finally {
    carregando.value = false
  }
}
</script>
