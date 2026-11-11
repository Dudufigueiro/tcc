<template>
  <div>
    <h2 class="text-h5 text-weight-medium q-mt-none q-mb-xs text-primary">Solicitar cadastro</h2>
    <p class="text-muted q-mb-lg">
      Exclusivo para professores do quadro efetivo. Após o envio, o gestor escolar valida seus dados
      e define o seu regime de carga horária.
    </p>

    <q-form class="q-gutter-md" @submit.prevent="enviar">
      <q-input
        v-model="form.nome"
        label="Nome completo *"
        outlined
        :rules="[obrigatorio]"
        lazy-rules="ondemand"
      />
      <q-input
        v-model="form.email"
        type="email"
        label="E-mail *"
        outlined
        autocomplete="username"
        :rules="[obrigatorio]"
        lazy-rules="ondemand"
      />
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="form.matricula"
            label="Matrícula *"
            outlined
            :rules="[obrigatorio]"
            lazy-rules="ondemand"
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-input
            v-model="form.data_chegada_unidade"
            type="date"
            label="Chegada à unidade"
            stack-label
            outlined
          />
        </div>
      </div>
      <q-input
        v-model="form.senha"
        type="password"
        label="Senha * (mín. 6 caracteres)"
        outlined
        autocomplete="new-password"
        :rules="[obrigatorio, (v) => v.length >= 6 || 'Use ao menos 6 caracteres.']"
        lazy-rules="ondemand"
      />
      <q-input
        v-model="confirmacao"
        type="password"
        label="Confirmar senha *"
        outlined
        autocomplete="new-password"
        :rules="[(v) => v === form.senha || 'As senhas não conferem.']"
        lazy-rules="ondemand"
      />

      <q-banner v-if="erros.length" rounded class="bg-red-1 text-negative">
        <div v-for="(e, i) in erros" :key="i">{{ e }}</div>
      </q-banner>

      <q-btn
        type="submit"
        color="secondary"
        unelevated
        no-caps
        size="lg"
        class="full-width"
        label="Enviar solicitação"
        :loading="carregando"
      />
    </q-form>

    <div class="q-mt-lg text-center text-muted">
      Já possui acesso?
      <router-link to="/login" class="text-primary text-weight-medium">Entrar</router-link>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth.service'
import { notificarSucesso } from '@/utils/notify'

const router = useRouter()
const form = reactive({ nome: '', email: '', matricula: '', data_chegada_unidade: '', senha: '' })
const confirmacao = ref('')
const carregando = ref(false)
const erros = ref([])

const obrigatorio = (v) => !!v || 'Campo obrigatório.'

async function enviar() {
  carregando.value = true
  erros.value = []
  try {
    await authService.solicitarCadastro({
      ...form,
      data_chegada_unidade: form.data_chegada_unidade || undefined,
    })
    notificarSucesso('Cadastro solicitado! Aguarde a validação pelo gestor para escolher aulas.')
    router.push('/login')
  } catch (e) {
    erros.value = e.detalhes?.length
      ? e.detalhes.map((d) => `${d.campo}: ${d.mensagem}`)
      : [e.mensagem]
  } finally {
    carregando.value = false
  }
}
</script>
