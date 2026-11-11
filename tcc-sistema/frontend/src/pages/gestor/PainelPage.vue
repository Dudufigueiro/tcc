<template>
  <q-page class="page">
    <PageHeader
      title="Painel de acompanhamento"
      subtitle="Situação da escolha de aulas no ano letivo."
    >
      <AnoLetivoSelect v-model="ano" />
      <q-btn flat round icon="refresh" aria-label="Atualizar" @click="carregar"
        ><q-tooltip>Atualizar</q-tooltip></q-btn
      >
    </PageHeader>

    <q-inner-loading :showing="carregando" />

    <div v-if="!dados && !carregando" class="card-flat q-pa-xl text-center text-muted">
      Cadastre turmas, disciplinas e vagas para começar.
    </div>

    <template v-if="dados">
      <!-- Indicadores -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6 col-md-3">
          <div class="card-flat stat-card">
            <div class="stat-label">Cadastros pendentes</div>
            <div class="stat-value" :class="dados.professores.pendentes ? 'text-warning' : ''">
              {{ dados.professores.pendentes }}
            </div>
            <div class="stat-hint">{{ dados.professores.aprovados }} professor(es) aprovado(s)</div>
            <q-btn
              v-if="dados.professores.pendentes"
              flat
              dense
              no-caps
              color="primary"
              label="Validar agora"
              to="/gestor/professores?status=PENDENTE"
              class="q-mt-xs q-px-none"
            />
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card-flat stat-card">
            <div class="stat-label">Vagas preenchidas</div>
            <div class="stat-value">
              {{ dados.vagas.preenchidas
              }}<span class="text-muted text-h6"> / {{ dados.vagas.total }}</span>
            </div>
            <q-linear-progress
              :value="razao(dados.vagas.preenchidas, dados.vagas.total)"
              rounded
              color="secondary"
              track-color="grey-3"
              class="q-mt-sm"
            />
            <div class="stat-hint">{{ dados.vagas.livres }} livre(s)</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card-flat stat-card">
            <div class="stat-label">Aulas atribuídas</div>
            <div class="stat-value">
              {{ dados.vagas.aulas_atribuidas
              }}<span class="text-muted text-h6"> / {{ dados.vagas.aulas_total }}</span>
            </div>
            <q-linear-progress
              :value="razao(dados.vagas.aulas_atribuidas, dados.vagas.aulas_total)"
              rounded
              color="primary"
              track-color="grey-3"
              class="q-mt-sm"
            />
            <div class="stat-hint">{{ dados.escolhas.confirmadas }} escolha(s) confirmada(s)</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card-flat stat-card">
            <div class="stat-label">Vagas em disputa</div>
            <div class="stat-value" :class="dados.vagas.em_disputa ? 'text-warning' : ''">
              {{ dados.vagas.em_disputa }}
            </div>
            <div class="stat-hint">
              {{ dados.escolhas.em_disputa }} interesse(s) aguardando decisão
            </div>
            <q-btn
              v-if="dados.escolhas.em_disputa"
              flat
              dense
              no-caps
              color="primary"
              label="Resolver disputas"
              to="/gestor/escolhas?aba=disputas"
              class="q-mt-xs q-px-none"
            />
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <!-- Carga por professor -->
        <div class="col-12 col-lg-7">
          <div class="card-flat q-pa-md">
            <h2 class="section-title">Carga horária dos professores</h2>
            <div v-if="!dados.carga_professores.length" class="text-muted">
              Nenhum professor aprovado ainda.
            </div>
            <div v-for="p in dados.carga_professores" :key="p.id" class="q-mb-md">
              <div class="row items-baseline justify-between">
                <span class="text-weight-medium"
                  >{{ p.nome }}
                  <span class="text-muted text-caption">· mat. {{ p.matricula }}</span></span
                >
                <span class="text-muted">{{ p.utilizada }} / {{ p.regime }} aulas</span>
              </div>
              <q-linear-progress
                :value="razao(p.utilizada, p.regime)"
                size="10px"
                rounded
                :color="p.utilizada >= p.regime ? 'warning' : 'secondary'"
                track-color="grey-3"
                class="q-mt-xs"
              />
            </div>
          </div>
        </div>

        <!-- Últimas alterações -->
        <div class="col-12 col-lg-5">
          <div class="card-flat q-pa-md">
            <div class="row items-center justify-between">
              <h2 class="section-title">Últimas alterações</h2>
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                label="Ver histórico"
                to="/gestor/historico"
              />
            </div>
            <div v-if="!dados.ultimas_alteracoes.length" class="text-muted">
              Ainda não há alterações.
            </div>
            <q-list separator>
              <q-item v-for="h in dados.ultimas_alteracoes" :key="h.id" class="q-px-none">
                <q-item-section>
                  <q-item-label>{{ ACAO_HISTORICO[h.acao] ?? h.acao }}</q-item-label>
                  <q-item-label caption lines="2">
                    {{ h.professor_nome }} · {{ h.disciplina_nome }} ({{ h.serie }}
                    {{ h.identificacao }})
                  </q-item-label>
                  <q-item-label caption
                    >por {{ h.usuario_nome }} · {{ formatarDataHora(h.data_hora) }}</q-item-label
                  >
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup>
import { ref, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import AnoLetivoSelect from '@/components/AnoLetivoSelect.vue'
import { painelService } from '@/services/gestao.service'
import { ACAO_HISTORICO, formatarDataHora } from '@/utils/format'
import { notificarErro } from '@/utils/notify'

const ano = ref(null)
const dados = ref(null)
const carregando = ref(false)

const razao = (parte, total) => (total ? Math.min(parte / total, 1) : 0)

async function carregar() {
  carregando.value = true
  try {
    const resposta = await painelService.resumo({ ano_letivo: ano.value || undefined })
    dados.value = resposta.vagas.total || resposta.professores.aprovados ? resposta : null
  } catch (e) {
    notificarErro(e)
  } finally {
    carregando.value = false
  }
}

watch(ano, carregar)
</script>
