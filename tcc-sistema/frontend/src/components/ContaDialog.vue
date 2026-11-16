<template>
  <q-dialog v-model="aberto" persistent @hide="limpar">
    <q-card style="width: 460px; max-width: 95vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Minha conta</div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" :disable="enviando" />
      </q-card-section>

      <q-tabs
        v-model="aba"
        dense
        no-caps
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="q-mt-sm"
      >
        <q-tab name="email" label="E-mail" :disable="enviando" />
        <q-tab name="senha" label="Senha" :disable="enviando" />
      </q-tabs>
      <q-separator />

      <q-tab-panels v-model="aba" animated>
        <!-- Trocar e-mail -->
        <q-tab-panel name="email">
          <q-form class="q-gutter-md" @submit.prevent="salvarEmail">
            <div class="text-muted">
              E-mail atual: <span class="text-weight-medium">{{ auth.usuario?.email }}</span>
            </div>

            <q-input
              v-model="email.novo"
              type="email"
              label="Novo e-mail"
              outlined
              dense
              autocomplete="email"
              :rules="[
                (v) => !!v || 'Informe o novo e-mail.',
                (v) => /^\S+@\S+\.\S+$/.test(v) || 'Informe um e-mail válido.',
              ]"
              lazy-rules="ondemand"
            />

            <q-input
              v-model="email.senha"
              :type="mostrar ? 'text' : 'password'"
              label="Senha atual"
              hint="Informe sua senha para confirmar a alteração."
              outlined
              dense
              autocomplete="current-password"
              :rules="[(v) => !!v || 'Informe a senha atual.']"
              lazy-rules="ondemand"
            >
              <template #append>
                <q-icon
                  :name="mostrar ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="mostrar = !mostrar"
                />
              </template>
            </q-input>

            <div class="row justify-end q-gutter-sm">
              <q-btn v-close-popup flat no-caps label="Cancelar" :disable="enviando" />
              <q-btn
                type="submit"
                color="primary"
                unelevated
                no-caps
                label="Salvar e-mail"
                :loading="enviando"
              />
            </div>
          </q-form>
        </q-tab-panel>

        <!-- Trocar senha -->
        <q-tab-panel name="senha">
          <q-form class="q-gutter-md" @submit.prevent="salvarSenha">
            <q-input
              v-model="senha.atual"
              :type="mostrar ? 'text' : 'password'"
              label="Senha atual"
              outlined
              dense
              autocomplete="current-password"
              :rules="[(v) => !!v || 'Informe a senha atual.']"
              lazy-rules="ondemand"
            />

            <q-input
              v-model="senha.nova"
              :type="mostrar ? 'text' : 'password'"
              label="Nova senha"
              hint="Entre 6 e 72 caracteres."
              outlined
              dense
              autocomplete="new-password"
              :rules="[
                (v) => !!v || 'Informe a nova senha.',
                (v) => v.length >= 6 || 'A nova senha deve ter pelo menos 6 caracteres.',
                (v) => v.length <= 72 || 'A nova senha deve ter no máximo 72 caracteres.',
              ]"
              lazy-rules="ondemand"
            />

            <q-input
              v-model="senha.confirmacao"
              :type="mostrar ? 'text' : 'password'"
              label="Confirmar nova senha"
              outlined
              dense
              autocomplete="new-password"
              :rules="[
                (v) => !!v || 'Confirme a nova senha.',
                (v) => v === senha.nova || 'As senhas não conferem.',
              ]"
              lazy-rules="ondemand"
            >
              <template #append>
                <q-icon
                  :name="mostrar ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="mostrar = !mostrar"
                />
              </template>
            </q-input>

            <div class="row justify-end q-gutter-sm">
              <q-btn v-close-popup flat no-caps label="Cancelar" :disable="enviando" />
              <q-btn
                type="submit"
                color="primary"
                unelevated
                no-caps
                label="Salvar senha"
                :loading="enviando"
              />
            </div>
          </q-form>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth-store'
import { authService } from '@/services/auth.service'
import { notificarErro, notificarSucesso } from '@/utils/notify'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  abaInicial: { type: String, default: 'email' },
})
const emit = defineEmits(['update:modelValue'])

const auth = useAuthStore()

const aberto = computed({
  get: () => props.modelValue,
  set: (valor) => emit('update:modelValue', valor),
})

const aba = ref(props.abaInicial)
const mostrar = ref(false)
const enviando = ref(false)
const email = reactive({ novo: '', senha: '' })
const senha = reactive({ atual: '', nova: '', confirmacao: '' })

// ao abrir, mostra a aba escolhida no menu
watch(
  () => props.modelValue,
  (aberta) => {
    if (aberta) aba.value = props.abaInicial
  },
)

function limpar() {
  email.novo = ''
  email.senha = ''
  senha.atual = ''
  senha.nova = ''
  senha.confirmacao = ''
  mostrar.value = false
}

async function salvarEmail() {
  enviando.value = true
  try {
    const { usuario, mensagem } = await authService.alterarEmail(email.novo.trim(), email.senha)
    auth.definirUsuario(usuario)
    notificarSucesso(mensagem || 'E-mail atualizado com sucesso.')
    aberto.value = false
  } catch (e) {
    notificarErro(e)
  } finally {
    enviando.value = false
  }
}

async function salvarSenha() {
  enviando.value = true
  try {
    const { mensagem } = await authService.alterarSenha(senha.atual, senha.nova)
    notificarSucesso(mensagem || 'Senha alterada com sucesso.')
    aberto.value = false
  } catch (e) {
    notificarErro(e)
  } finally {
    enviando.value = false
  }
}
</script>
